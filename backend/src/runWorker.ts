import { startEmailWorker } from "./queue/emailWorker.js";
import { reconcileScheduledEmails } from "./services/reconcile.js";

const RECONCILE_INTERVAL_MS = 5 * 60 * 1000;

/** Starts the queue worker and the reconciliation sweep. Called either from its own
 *  process (locally, so the restart demo can kill it independently) or from inside the
 *  API process (on hosts that only give you one). */
export function runWorker() {
  const worker = startEmailWorker();
  console.log("email worker started");

  worker.on("completed", (job) => console.log(`sent ${job.data.recipient}`));
  worker.on("failed", (job, err) => console.error(`failed ${job?.data.recipient}: ${err.message}`));

  // A boot sweep matters most on hosts that idle the process out: anything that came
  // due while it was asleep is picked up as soon as it wakes, so nothing is lost — it
  // just goes out late.
  const sweep = () => reconcileScheduledEmails().catch((err) => console.error("reconcile failed", err));
  sweep();
  const timer = setInterval(sweep, RECONCILE_INTERVAL_MS);

  return async function stop() {
    clearInterval(timer);
    await worker.close();
  };
}
