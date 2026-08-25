import { Router } from "express";
import { z } from "zod";
import { scheduleEmails } from "../services/schedulerService.js";
import { listScheduled, listSent } from "../services/emailService.js";
import type { AuthedRequest } from "../auth/middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const emailsRouter = Router();

const MAX_ATTACHMENT_BASE64 = Math.ceil((5 * 1024 * 1024 * 4) / 3);

const scheduleSchema = z.object({
  senderId: z.string().uuid(),
  recipients: z.array(z.string().email()).min(1),
  subject: z.string().min(1),
  bodyHtml: z.string().min(1),
  scheduledFor: z.coerce.date(),
  minDelayMs: z.number().int().nonnegative().optional(),
  hourlyLimit: z.number().int().positive().optional(),
  attachments: z
    .array(
      z.object({
        filename: z.string().min(1).max(255),
        contentType: z.string().min(1).max(128),
        // base64 encodes 3 bytes as 4 chars, so this caps each file at ~5MB. The client
        // checks too, but the client isn't the one we trust.
        content: z.string().max(MAX_ATTACHMENT_BASE64),
      }),
    )
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

emailsRouter.post(
  "/schedule",
  asyncHandler<AuthedRequest>(async (req, res) => {
    const parsed = scheduleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const rows = await scheduleEmails({ ...parsed.data, userId: userId(req) });
    res.status(201).json({ scheduled: rows.length, batchId: rows[0]?.batchId ?? null });
  }),
);

emailsRouter.get(
  "/scheduled",
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { page, pageSize } = pagination(req);
    res.json(await listScheduled(userId(req), page, pageSize));
  }),
);

emailsRouter.get(
  "/sent",
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { page, pageSize } = pagination(req);
    res.json(await listSent(userId(req), page, pageSize));
  }),
);
