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
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  // Mailboxes provisioned for each new account, as "email|Display Name" entries.
  DEFAULT_SENDERS: z
    .string()
    .default("outreach@outbox-demo.dev|Outreach,sales@outbox-demo.dev|Sales,hello@outbox-demo.dev|Hello"),
  // Requests per minute per IP against the API.
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(120),
  // Optional — the compose assistant is hidden when no key is present.
  OPENROUTER_API_KEY: z.string().optional(),
  LLM_BASE_URL: z.string().url().default("https://openrouter.ai/api/v1"),
  LLM_MODEL: z.string().default("openai/gpt-4o-mini"),
  // Optional — attachments are disabled when unset. The SDK reads this format directly.
  CLOUDINARY_URL: z.string().optional(),
});

export const env = schema.parse(process.env);
