import "dotenv/config";
import { prisma } from "../src/db/client.js";
import { emailQueue } from "../src/queue/emailQueue.js";
import { redis } from "../src/redis/client.js";

// Clears scheduled emails and the queue state behind them. Requires an explicit
// target, because a bare run used to wipe every account.
//   npx tsx scripts/reset.ts <userId>   clears just that account
//   npx tsx scripts/reset.ts --all      clears every account
// Called through npx rather than npm: npm drops arguments after `--` for a package
// that is a workspace member.
const arg = process.argv[2];

async function main() {
  if (!arg) {
    console.error(
      "refusing to run without a target.\n" +
        "  npx tsx scripts/reset.ts <userId>   clear one account\n" +
        "  npx tsx scripts/reset.ts --all      clear everything",
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
