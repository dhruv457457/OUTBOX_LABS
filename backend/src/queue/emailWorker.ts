import { DelayedError, Worker, type Job } from "bullmq";
import { prisma } from "../db/client.js";
import { redis } from "../redis/client.js";
import { sendEmail, type EmailAttachment } from "../mailer/etherealTransport.js";
import { env } from "../config/env.js";
import { EMAIL_QUEUE_NAME, type EmailJobData } from "./jobTypes.js";
import {
  nextHourBoundary,
  releaseHourlySlot,
  tryClaimHourlySlot,
  tryClaimMinDelay,
} from "./rateLimiter.js";

async function processEmailJob(job: Job<EmailJobData>, token?: string) {
  const { scheduledEmailId, senderId, senderEmail, recipient, subject, bodyHtml, minDelayMs, hourlyLimit } =
    job.data;

  // Claim the row atomically. Anything not in SCHEDULED was already handled (sent, or
  // picked up by another worker), so there's nothing to do — this is what keeps retries
  // and duplicate deliveries of the same job idempotent.
  const claimed = await prisma.scheduledEmail.updateMany({
    where: { id: scheduledEmailId, status: "SCHEDULED" },
    data: { status: "PROCESSING" },
  });
  if (claimed.count === 0) return;

  // Both limits are checked after claiming, so releasing the claim is part of every
  // reschedule path below.
  async function reschedule(runAt: number) {
    // scheduledFor tracks when this will actually go out, so a deferred email doesn't
    // sit in the dashboard showing a time that's already passed.
    await prisma.scheduledEmail.update({
      where: { id: scheduledEmailId },
      data: { status: "SCHEDULED", scheduledFor: new Date(runAt) },
    });
    await job.moveToDelayed(runAt, token);
    throw new DelayedError(); // tells BullMQ this was a deliberate delay, not a completion
  }

  if (!(await tryClaimHourlySlot(senderId, hourlyLimit))) {
    await reschedule(nextHourBoundary().getTime());
  }

  if (!(await tryClaimMinDelay(senderId, minDelayMs))) {
    const remainingMs = await redis.pttl(`rl:lastsent:${senderId}`);
    await releaseHourlySlot(senderId); // we're not sending this hour after all
    await reschedule(Date.now() + Math.max(remainingMs, 100));
  }

  const row = await prisma.scheduledEmail.findUnique({ where: { id: scheduledEmailId } });
  const attachments = (row?.attachments ?? undefined) as EmailAttachment[] | undefined;

  let previewUrl: string | false | undefined;
  try {
    previewUrl = await sendEmail({ from: senderEmail, to: recipient, subject, html: bodyHtml, attachments });
  } catch (err) {
    await releaseHourlySlot(senderId);
    // Back to SCHEDULED so BullMQ's retry can re-claim it — without this the retry would
    // see PROCESSING and short-circuit, and the email would never go out.
    await prisma.scheduledEmail.update({
      where: { id: scheduledEmailId },
      data: { status: "SCHEDULED", attempt: { increment: 1 }, lastError: (err as Error).message },
    });
    throw err;
  }

  // Sent for real at this point — never re-enqueue past here, or we'd send twice.
  await prisma.scheduledEmail.update({
    where: { id: scheduledEmailId },
    data: { status: "SENT", sentAt: new Date(), previewUrl: previewUrl || null },
  });
  if (previewUrl) console.log(`preview: ${previewUrl}`);
}

export function startEmailWorker() {
  const worker = new Worker<EmailJobData>(EMAIL_QUEUE_NAME, processEmailJob, {
    connection: redis,
    concurrency: env.WORKER_CONCURRENCY,
    stalledInterval: 30_000,
    maxStalledCount: 1,
  });

  worker.on("failed", async (job, err) => {
    if (!job || err instanceof DelayedError) return;
    const maxAttempts = job.opts.attempts ?? 1;
    if (job.attemptsMade < maxAttempts) return; // more retries still queued

    await prisma.scheduledEmail.updateMany({
      where: { id: job.data.scheduledEmailId, status: { not: "SENT" } },
      data: { status: "FAILED", lastError: err.message },
    });
  });

  return worker;
}
