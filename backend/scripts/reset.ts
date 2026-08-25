import "dotenv/config";
import { prisma } from "../src/db/client.js";
import { emailQueue } from "../src/queue/emailQueue.js";
import { redis } from "../src/redis/client.js";

// Wipes every scheduled email plus the queue and rate-limit state behind them.
// Useful for starting a clean demo run.
async function main() {
  await emailQueue.obliterate({ force: true });

  const { count } = await prisma.scheduledEmail.deleteMany({});
  for (const key of await redis.keys("rl:*")) await redis.del(key);

  console.log(`cleared ${count} emails, drained the queue, reset rate-limit counters`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await emailQueue.close();
    redis.disconnect();
  });
