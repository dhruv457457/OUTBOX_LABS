import "dotenv/config";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { requireAuth } from "./auth/middleware.js";
import { emailsRouter } from "./routes/emails.routes.js";
import { sendersRouter } from "./routes/senders.routes.js";
import { uploadRouter } from "./routes/upload.routes.js";

const app = express();
// Only the dashboard should be able to call this API from a browser.
app.use(cors({ origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()) }));
app.use(express.json({ limit: "10mb" })); // headroom for base64-encoded attachments

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/emails", requireAuth, emailsRouter);
app.use("/api/senders", requireAuth, sendersRouter);
app.use("/api/upload-list", requireAuth, uploadRouter);

app.listen(env.PORT, () => {
  console.log(`api listening on :${env.PORT}`);
});
