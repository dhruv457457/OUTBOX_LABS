import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { improveDraft } from "../services/aiService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { AuthedRequest } from "../auth/middleware.js";

export const aiRouter = Router();

const schema = z.object({
  subject: z.string().max(300).optional(),
  bodyHtml: z.string().min(1).max(20_000),
  senderName: z.string().max(120).optional(),
});

// Model calls cost money and take seconds, so these get a tighter budget than the
// rest of the API.
const aiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "too many AI requests, give it a minute" },
});

aiRouter.post(
  "/improve",
  aiLimiter,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    res.json(await improveDraft(parsed.data));
  }),
);
