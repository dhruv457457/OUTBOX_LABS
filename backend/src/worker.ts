import "dotenv/config";
import { startEmailWorker } from "./queue/emailWorker.js";
import { reconcileScheduledEmails } from "./services/reconcile.js";

const worker = startEmailWorker();
console.log("email worker started");

worker.on("completed", (job) => console.log(`sent ${job.data.recipient}`));
worker.on("failed", (job, err) => console.error(`failed ${job?.data.recipient}: ${err.message}`));

// Boot-time sweep catches anything left orphaned by whatever killed the previous
// instance of this process — see services/reconcile.ts for why this is needed on top
// of BullMQ's own stalled-job recovery.
reconcileScheduledEmails().catch((err) => console.error("reconcile on boot failed", err));
setInterval(() => {
  reconcileScheduledEmails().catch((err) => console.error("reconcile failed", err));
}, 5 * 60 * 1000);

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});
