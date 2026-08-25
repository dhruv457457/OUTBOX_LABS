import { prisma } from "../db/client.js";
import { emailQueue, scheduleEmailJob } from "../queue/emailQueue.js";

const GRACE_MS = 2 * 60 * 1000;
const STUCK_PROCESSING_MS = 10 * 60 * 1000;
// Bounded so a large backlog can't pull the whole table into memory; the sweep runs
// often enough to work through one in batches.
const BATCH_SIZE = 200;

/** Safety net for restart survival: catches rows whose BullMQ job went missing (e.g. an
 *  enqueue call failed after the DB write) or got stuck mid-send when a worker died in a
 *  way BullMQ's own stalled-job recovery didn't catch. Not the scheduler itself — just
 *  housekeeping that runs alongside it. */
export async function reconcileScheduledEmails() {
  const now = new Date();
  const stuck = await prisma.scheduledEmail.findMany({
    where: {
      OR: [
        { status: "SCHEDULED", scheduledFor: { lt: new Date(now.getTime() - GRACE_MS) } },
        { status: "PROCESSING", updatedAt: { lt: new Date(now.getTime() - STUCK_PROCESSING_MS) } },
      ],
    },
    include: { sender: true },
    orderBy: { scheduledFor: "asc" },
    take: BATCH_SIZE,
  });

  for (const row of stuck) {
    const job = await emailQueue.getJob(row.id);
    if (job) continue; // job exists, BullMQ is already handling it

    await prisma.scheduledEmail.update({ where: { id: row.id }, data: { status: "SCHEDULED" } });
    await scheduleEmailJob(
      {
        scheduledEmailId: row.id,
        senderId: row.senderId,
        senderEmail: row.sender.email,
        recipient: row.recipient,
        subject: row.subject,
        bodyHtml: row.bodyHtml,
        minDelayMs: row.minDelayMs,
        hourlyLimit: row.hourlyLimit,
      },
      row.scheduledFor < now ? now : row.scheduledFor,
    );
  }

  return stuck.length;
}
