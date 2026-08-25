import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/client.js";

export const sendersRouter = Router();

sendersRouter.get("/", async (_req, res) => {
  const senders = await prisma.sender.findMany({ orderBy: { createdAt: "asc" } });
  res.json(senders);
});

const createSchema = z.object({ email: z.string().email(), name: z.string().optional() });

sendersRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const sender = await prisma.sender.upsert({
    where: { email: parsed.data.email },
    update: { name: parsed.data.name },
    create: parsed.data,
  });
  res.status(201).json(sender);
});
