import { Worker, type Job } from "bullmq";
import { prisma } from "../db/client.js";
import { redis } from "../redis/client.js";
import { sendEmail } from "../mailer/etherealTransport.js";
import { env } from "../config/env.js";
import { EMAIL_QUEUE_NAME, type EmailJobData } from "./jobTypes.js";
import { nextHourBoundary, tryClaimHourlySlot, tryClaimMinDelay } from "./rateLimiter.js";

async function processEmailJob(job: Job<EmailJobData>) {
  const { scheduledEmailId, senderId, senderEmail, recipient, subject, bodyHtml, minDelayMs, hourlyLimit } =
    job.data;

  const row = await prisma.scheduledEmail.findUnique({ where: { id: scheduledEmailId } });
  if (!row || row.status !== "SCHEDULED") {
    // Already handled (sent, failed, or claimed by another attempt) — nothing to do.
    return;
  }

  const claimed = await prisma.scheduledEmail.updateMany({
    where: { id: scheduledEmailId, status: "SCHEDULED" },
    data: { status: "PROCESSING" },
  });
  if (claimed.count === 0) return; // lost the race to another worker

  const hourlyOk = await tryClaimHourlySlot(senderId, hourlyLimit);
  if (!hourlyOk) {
    await prisma.scheduledEmail.update({
      where: { id: scheduledEmailId },
      data: { status: "SCHEDULED" },
    });
    await job.moveToDelayed(nextHourBoundary().getTime());
    return;
  }

  const delayOk = await tryClaimMinDelay(senderId, minDelayMs);
  if (!delayOk) {
    const remainingMs = await redis.pttl(`rl:lastsent:${senderId}`);
    await prisma.scheduledEmail.update({
      where: { id: scheduledEmailId },
      data: { status: "SCHEDULED" },
    });
    await job.moveToDelayed(Date.now() + Math.max(remainingMs, 100));
    return;
  }

  try {
    await sendEmail({ from: senderEmail, to: recipient, subject, html: bodyHtml });
    await prisma.scheduledEmail.update({
      where: { id: scheduledEmailId },
      data: { status: "SENT", sentAt: new Date() },
    });
  } catch (err) {
    await prisma.scheduledEmail.update({
      where: { id: scheduledEmailId },
      data: { attempt: { increment: 1 }, lastError: (err as Error).message },
    });
    throw err; // let BullMQ retry with backoff; worker's "failed" handler marks it FAILED after the last attempt
  }
}

export function startEmailWorker() {
  const worker = new Worker<EmailJobData>(EMAIL_QUEUE_NAME, processEmailJob, {
    connection: redis,
    concurrency: env.WORKER_CONCURRENCY,
    stalledInterval: 30_000,
    maxStalledCount: 1,
  });

  worker.on("failed", async (job, err) => {
    if (!job) return;
    const attemptsLeft = job.opts.attempts ? job.attemptsMade < job.opts.attempts : false;
    if (attemptsLeft) return; // still has retries queued up

    await prisma.scheduledEmail.updateMany({
      where: { id: job.data.scheduledEmailId, status: { not: "SENT" } },
      data: { status: "FAILED", lastError: err.message },
    });
  });

  return worker;
}
