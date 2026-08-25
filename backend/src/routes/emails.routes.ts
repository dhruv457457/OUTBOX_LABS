import { Router } from "express";
import { z } from "zod";
import { scheduleEmails } from "../services/schedulerService.js";
import { listScheduled, listSent } from "../services/emailService.js";
import type { AuthedRequest } from "../auth/middleware.js";

export const emailsRouter = Router();

const scheduleSchema = z.object({
  senderId: z.string().uuid(),
  recipients: z.array(z.string().email()).min(1),
  subject: z.string().min(1),
  bodyHtml: z.string().min(1),
  scheduledFor: z.coerce.date(),
  minDelayMs: z.number().int().nonnegative().optional(),
  hourlyLimit: z.number().int().positive().optional(),
  attachments: z
    .array(z.object({ filename: z.string(), contentType: z.string(), content: z.string() }))
    .max(5)
    .optional(),
});

// The owner always comes from the verified token, never from the request body, so a
// caller can't schedule or read on someone else's behalf.
function userId(req: AuthedRequest) {
  return req.user!.id;
}

function pagination(req: AuthedRequest) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 25));
  return { page, pageSize };
}

emailsRouter.post("/schedule", async (req: AuthedRequest, res) => {
  const parsed = scheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const rows = await scheduleEmails({ ...parsed.data, userId: userId(req) });
  res.status(201).json({ scheduled: rows.length, batchId: rows[0]?.batchId ?? null });
});

emailsRouter.get("/scheduled", async (req: AuthedRequest, res) => {
  const { page, pageSize } = pagination(req);
  res.json(await listScheduled(userId(req), page, pageSize));
});

emailsRouter.get("/sent", async (req: AuthedRequest, res) => {
  const { page, pageSize } = pagination(req);
  res.json(await listSent(userId(req), page, pageSize));
});
