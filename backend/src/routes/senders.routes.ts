import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/client.js";
import { listSendersForUser } from "../services/senderService.js";
import type { AuthedRequest } from "../auth/middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const sendersRouter = Router();

sendersRouter.get(
  "/",
  asyncHandler<AuthedRequest>(async (req, res) => {
    res.json(await listSendersForUser(req.user!.id));
  }),
);

const createSchema = z.object({ email: z.string().email(), name: z.string().optional() });

sendersRouter.post(
  "/",
  asyncHandler<AuthedRequest>(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const userId = req.user!.id;
    const sender = await prisma.sender.upsert({
      where: { userId_email: { userId, email: parsed.data.email } },
      update: { name: parsed.data.name },
      create: { userId, ...parsed.data },
    });
    res.status(201).json(sender);
  }),
);
