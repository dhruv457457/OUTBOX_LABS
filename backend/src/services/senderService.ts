import { prisma } from "../db/client.js";
import { env } from "../config/env.js";

/** Every account starts with its own set of mailboxes so the per-sender rate limits
 *  have something to spread across. Ethereal accepts any from-address over the one
 *  test account, so these are all deliverable. */
export async function listSendersForUser(userId: string) {
  const existing = await prisma.sender.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (existing.length > 0) return existing;

  const defaults = env.DEFAULT_SENDERS.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [email, ...name] = entry.split("|");
      return { userId, email: email.trim(), name: name.join("|").trim() || null };
    });

  await prisma.sender.createMany({ data: defaults, skipDuplicates: true });
  return prisma.sender.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
}

/** Resolves a sender the user actually owns — returns null if it's someone else's. */
export function findOwnedSender(userId: string, senderId: string) {
  return prisma.sender.findFirst({ where: { id: senderId, userId } });
}
