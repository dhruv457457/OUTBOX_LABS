import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  ETHEREAL_USER: z.string().min(1),
  ETHEREAL_PASS: z.string().min(1),
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(5),
  DEFAULT_MIN_DELAY_MS: z.coerce.number().int().nonnegative().default(2000),
  DEFAULT_HOURLY_LIMIT: z.coerce.number().int().positive().default(200),
  PORT: z.coerce.number().int().positive().default(4000),
});

export const env = schema.parse(process.env);
