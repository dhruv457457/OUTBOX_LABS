import type { Prisma } from "@prisma/client";
import { prisma } from "../db/client.js";
import { emailQueue, scheduleEmailJob } from "../queue/emailQueue.js";

const GRACE_MS = 2 * 60 * 1000;
const STUCK_PROCESSING_MS = 10 * 60 * 1000;
// Bounded so a large backlog can't pull the whole table into memory.
const BATCH_SIZE = 200;
const MAX_BATCHES = 50;

/** Re-queues anything the database still expects to send but Redis has no job for.
 *
 *  Two modes. The periodic pass only looks at emails already overdue, which is cheap
 *  and covers the usual cases: an enqueue that failed after the row was committed, or a
 *  worker that died mid-send. The boot pass also takes in future emails, because a
 *  Redis that lost its data — free hosting tiers keep it in memory only — would
 *  otherwise leave them invisible until each one was already late. Postgres is the
 *  source of truth, so the queue can always be rebuilt from it. */
export async function reconcileScheduledEmails({ includeFuture = false } = {}) {
  const now = new Date();

  const stalePending: Prisma.ScheduledEmailWhereInput = includeFuture
    ? { status: "SCHEDULED" }
    : { status: "SCHEDULED", scheduledFor: { lt: new Date(now.getTime() - GRACE_MS) } };

  const where: Prisma.ScheduledEmailWhereInput = {
    OR: [stalePending, { status: "PROCESSING", updatedAt: { lt: new Date(now.getTime() - STUCK_PROCESSING_MS) } }],
  };

  let requeued = 0;
  let cursor: string | undefined;

  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const rows = await prisma.scheduledEmail.findMany({
      where,
      include: { sender: true },
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (rows.length === 0) break;
    cursor = rows[rows.length - 1].id;

    for (const row of rows) {
      if (await emailQueue.getJob(row.id)) continue; // BullMQ still has it

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
      requeued++;
    }

    // The periodic pass deliberately stops after one batch; the boot pass keeps going
    // until the table is drained.
    if (!includeFuture) break;
  }

  if (requeued > 0) console.log(`reconcile: re-queued ${requeued} email(s)`);
  return requeued;
}
