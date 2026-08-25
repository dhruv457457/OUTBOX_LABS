import { Redis } from "ioredis";
import { env } from "../config/env.js";

// BullMQ needs this — it retries connections itself, so no reconnect strategy needed here.
export const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
