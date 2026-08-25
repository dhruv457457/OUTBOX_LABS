import "dotenv/config";
import { prisma } from "../src/db/client.js";
import { scheduleEmails } from "../src/services/schedulerService.js";
import { redis } from "../src/redis/client.js";

// Schedules a burst of emails all due immediately, against a deliberately low hourly
// limit, so you can watch the limiter spread them out instead of dropping them.
//   npm run loadtest -- 12 5 1 <userId> <startInSeconds>
// Pass the Supabase user id to have the rows show up in that account's dashboard;
// otherwise they're owned by a stand-in id and stay out of everyone's way. The last
// argument schedules the batch into the future, which is what the restart test needs.
const [count = "12", hourlyLimit = "5", delaySeconds = "1", user = "load-test-user", startIn = "0"] =
  process.argv.slice(2);

async function main() {
  const sender = await prisma.sender.findFirst();
  if (!sender) throw new Error("no sender — run `npm run prisma:seed` first");

  const recipients = Array.from({ length: Number(count) }, (_, i) => `load-test-${i + 1}@example.com`);

  const rows = await scheduleEmails({
    userId: user,
    senderId: sender.id,
    recipients,
    subject: `Load test — limit ${hourlyLimit}/hr`,
    bodyHtml: "<p>Load test message.</p>",
    scheduledFor: new Date(Date.now() + Number(startIn) * 1000),
    minDelayMs: Number(delaySeconds) * 1000,
    hourlyLimit: Number(hourlyLimit),
  });

  console.log(`scheduled ${rows.length} emails (hourly limit ${hourlyLimit}, ${delaySeconds}s between sends)`);
  console.log("watching status counts — Ctrl+C to stop\n");

  const batchId = rows[0].batchId;
  setInterval(async () => {
    const grouped = await prisma.scheduledEmail.groupBy({
      by: ["status"],
      where: batchId ? { batchId } : { id: { in: rows.map((r) => r.id) } },
      _count: true,
    });
    const summary = grouped.map((g) => `${g.status}=${g._count}`).join("  ");
    console.log(`[${new Date().toLocaleTimeString()}] ${summary}`);
  }, 3000);
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  redis.disconnect();
  process.exit(1);
});
