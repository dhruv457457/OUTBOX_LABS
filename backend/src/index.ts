import "dotenv/config";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { requireAuth } from "./auth/middleware.js";
import { emailsRouter } from "./routes/emails.routes.js";
import { sendersRouter } from "./routes/senders.routes.js";
import { uploadRouter } from "./routes/upload.routes.js";

const app = express();

// Only the dashboard should be able to call this API from a browser.
app.use(cors({ origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()) }));
app.use(express.json({ limit: "12mb" })); // headroom for base64-encoded attachments

// A valid token shouldn't be a licence to hammer the API.
const limiter = rateLimit({
  windowMs: 60_000,
  limit: env.RATE_LIMIT_PER_MINUTE,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "too many requests, slow down" },
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/emails", limiter, requireAuth, emailsRouter);
app.use("/api/senders", limiter, requireAuth, sendersRouter);
app.use("/api/upload-list", limiter, requireAuth, uploadRouter);

// Anything a route throws lands here rather than hanging the request.
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(400).json({ error: err.message });
});

app.listen(env.PORT, () => {
  console.log(`api listening on :${env.PORT}`);
});
