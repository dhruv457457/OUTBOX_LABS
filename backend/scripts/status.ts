import "dotenv/config";
import { prisma } from "../src/db/client.js";
import { redis } from "../src/redis/client.js";

// Quick snapshot of what the scheduler is currently holding.
async function main() {
  const byStatus = await prisma.scheduledEmail.groupBy({ by: ["status"], _count: true });
  console.log("all emails by status:");
  for (const g of byStatus) console.log(`  ${g.status.padEnd(11)} ${g._count}`);

  const sent = await prisma.scheduledEmail.findMany({
    where: { status: "SENT" },
    orderBy: { sentAt: "desc" },
    select: { recipient: true, subject: true, previewUrl: true },
    take: 10,
  });
  if (sent.length) {
    console.log("\nsent emails:");
    for (const s of sent) console.log(`  ${s.recipient.padEnd(28)} ${s.previewUrl ?? "(no preview url)"}`);
  }

  const pending = await prisma.scheduledEmail.findMany({
    where: { status: "SCHEDULED" },
    orderBy: { scheduledFor: "asc" },
    select: { recipient: true, scheduledFor: true },
    take: 5,
  });
  if (pending.length) {
    console.log("\nnext scheduled:");
    for (const p of pending) console.log(`  ${p.scheduledFor.toLocaleString()}  ${p.recipient}`);
  }

  const keys = await redis.keys("rl:*");
  if (keys.length) {
    console.log("\nrate-limit counters in redis:");
    for (const k of keys) console.log(`  ${k} = ${await redis.get(k)}  (ttl ${await redis.ttl(k)}s)`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    redis.disconnect();
  });
