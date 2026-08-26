import { prisma } from "../db/client.js";
import type { EmailStatus, Prisma } from "@prisma/client";

export async function listScheduled(userId: string, page: number, pageSize: number) {
  const where: Prisma.ScheduledEmailWhereInput = {
    userId,
    status: { in: ["SCHEDULED", "PROCESSING"] as EmailStatus[] },
  };
  const [rows, total] = await Promise.all([
    prisma.scheduledEmail.findMany({
      where,
      include: { sender: true },
      orderBy: { scheduledFor: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.scheduledEmail.count({ where }),
  ]);
  return { rows, total };
}

export async function listSent(userId: string, page: number, pageSize: number) {
  const where: Prisma.ScheduledEmailWhereInput = {
    userId,
    status: { in: ["SENT", "FAILED"] as EmailStatus[] },
  };
  const [rows, total] = await Promise.all([
    prisma.scheduledEmail.findMany({
      where,
      include: { sender: true },
      orderBy: { sentAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.scheduledEmail.count({ where }),
  ]);
  return { rows, total };
}

export function setStarred(userId: string, id: string, starred: boolean) {
  return prisma.scheduledEmail.updateMany({ where: { id, userId }, data: { starred } });
}
