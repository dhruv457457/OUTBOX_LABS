import { redis } from "../redis/client.js";

function hourBucketKey(senderId: string, at: Date) {
  const stamp = at.toISOString().slice(0, 13).replace(/[-T]/g, ""); // YYYYMMDDHH
  return `rl:hour:${senderId}:${stamp}`;
}

export function nextHourBoundary(from = new Date()) {
  const next = new Date(from);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return next;
}

/** Atomically claims a slot in the current hour's send count. Returns false (and undoes
 *  the claim) if the sender is already at their hourly limit. */
export async function tryClaimHourlySlot(senderId: string, hourlyLimit: number) {
  const key = hourBucketKey(senderId, new Date());
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 3700);

  if (count > hourlyLimit) {
    await redis.decr(key);
    return false;
  }
  return true;
}

/** Atomically claims the "last sent" slot for a sender if minDelayMs has elapsed since
 *  their last send. Returns false if it's too soon. */
export async function tryClaimMinDelay(senderId: string, minDelayMs: number) {
  if (minDelayMs <= 0) return true;
  const key = `rl:lastsent:${senderId}`;
  const claimed = await redis.set(key, Date.now(), "PX", minDelayMs, "NX");
  return claimed === "OK";
}
