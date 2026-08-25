import { randomUUID } from "node:crypto";
import { prisma } from "../db/client.js";
import { scheduleEmailJob } from "../queue/emailQueue.js";
import { env } from "../config/env.js";

interface ScheduleInput {
  senderId: string;
  recipients: string[];
  subject: string;
  bodyHtml: string;
  scheduledFor: Date;
  minDelayMs?: number;
  hourlyLimit?: number;
}

export async function scheduleEmails(input: ScheduleInput) {
  const sender = await prisma.sender.findUnique({ where: { id: input.senderId } });
  if (!sender) throw new Error("unknown sender");

  const minDelayMs = input.minDelayMs ?? env.DEFAULT_MIN_DELAY_MS;
  const hourlyLimit = input.hourlyLimit ?? env.DEFAULT_HOURLY_LIMIT;
  const batchId = input.recipients.length > 1 ? randomUUID() : null;

  const rows = await prisma.$transaction(
    input.recipients.map((recipient) =>
      prisma.scheduledEmail.create({
        data: {
          senderId: sender.id,
          recipient,
          subject: input.subject,
          bodyHtml: input.bodyHtml,
          scheduledFor: input.scheduledFor,
          minDelayMs,
          hourlyLimit,
          batchId,
        },
      }),
    ),
  );

  await Promise.all(
    rows.map((row) =>
      scheduleEmailJob(
        {
          scheduledEmailId: row.id,
          senderId: sender.id,
          senderEmail: sender.email,
          recipient: row.recipient,
          subject: row.subject,
          bodyHtml: row.bodyHtml,
          minDelayMs: row.minDelayMs,
          hourlyLimit: row.hourlyLimit,
        },
        row.scheduledFor,
      ),
    ),
  );

  return rows;
}
