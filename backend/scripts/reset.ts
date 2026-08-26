import "dotenv/config";
import { prisma } from "../src/db/client.js";
import { emailQueue } from "../src/queue/emailQueue.js";
import { redis } from "../src/redis/client.js";

// Clears scheduled emails and the queue state behind them.
//   npm run reset -- <userId>   clears just that account
//   npm run reset -- --all      clears every account
// Requires one of the two, because this used to wipe real data by default.
const arg = process.argv[2];

async function main() {
  if (!arg) {
    console.error(
      "refusing to run without a target.\n" +
        "  npm run reset -- <userId>   clear one account\n" +
        "  npm run reset -- --all      clear everything",
    );
    process.exitCode = 1;
    return;
  }

  const everything = arg === "--all";
  const where = everything ? {} : { userId: arg };

  const doomed = await prisma.scheduledEmail.findMany({ where, select: { id: true } });

  if (everything) {
    // Pause first so the worker stops claiming jobs; obliterating underneath an active
    // worker makes it throw "Missing key for job" on whatever it was already holding.
    await emailQueue.pause();
    await emailQueue.obliterate({ force: true });
    await emailQueue.resume();
  } else {
    for (const { id } of doomed) await (await emailQueue.getJob(id))?.remove();
  }

  const { count } = await prisma.scheduledEmail.deleteMany({ where });
  if (everything) for (const key of await redis.keys("rl:*")) await redis.del(key);

  console.log(`cleared ${count} emails for ${everything ? "all accounts" : arg}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await emailQueue.close();
    redis.disconnect();
  });
