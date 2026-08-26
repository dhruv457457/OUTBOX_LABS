import "dotenv/config";
import { runWorker } from "./runWorker.js";

// Standalone worker process — this is the one to kill and restart when demonstrating
// that scheduled emails survive a restart.
const stop = runWorker();

process.on("SIGTERM", async () => {
  await stop();
  process.exit(0);
});
