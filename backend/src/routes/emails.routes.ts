import { Router } from "express";
import { z } from "zod";
import { scheduleEmails } from "../services/schedulerService.js";
import { listScheduled, listSent } from "../services/emailService.js";

export const emailsRouter = Router();

const scheduleSchema = z.object({
  senderId: z.string().uuid(),
  recipients: z.array(z.string().email()).min(1),
  subject: z.string().min(1),
  bodyHtml: z.string().min(1),
  scheduledFor: z.coerce.date(),
  minDelayMs: z.number().int().nonnegative().optional(),
  hourlyLimit: z.number().int().positive().optional(),
});

emailsRouter.post("/schedule", async (req, res) => {
  const parsed = scheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const rows = await scheduleEmails(parsed.data);
  res.status(201).json({ scheduled: rows.length, batchId: rows[0]?.batchId ?? null });
});

emailsRouter.get("/scheduled", async (req, res) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 25;
  res.json(await listScheduled(page, pageSize));
});

emailsRouter.get("/sent", async (req, res) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 25;
  res.json(await listSent(page, pageSize));
});
