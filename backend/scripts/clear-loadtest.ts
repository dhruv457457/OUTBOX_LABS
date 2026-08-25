import "dotenv/config";
import { prisma } from "../src/db/client.js";
import { emailQueue } from "../src/queue/emailQueue.js";
import { redis } from "../src/redis/client.js";

// Removes load-test rows and their queued jobs so they don't clutter the dashboard.
async function main() {
  const rows = await prisma.scheduledEmail.findMany({
    where: { recipient: { startsWith: "load-test-" } },
    select: { id: true },
  });

  for (const { id } of rows) {
    const job = await emailQueue.getJob(id);
    await job?.remove();
  }

  const { count } = await prisma.scheduledEmail.deleteMany({
    where: { recipient: { startsWith: "load-test-" } },
  });

  for (const key of await redis.keys("rl:*")) await redis.del(key);
  console.log(`removed ${count} load-test emails and reset rate-limit counters`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await emailQueue.close();
    redis.disconnect();
  });
