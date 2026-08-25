# Outbox — Email Scheduler

A full-stack email scheduler built for the Outbox Labs / ReachInbox SDE internship
assignment: schedule emails via API, deliver them through a persistent BullMQ+Redis
queue (no cron), and manage everything from a Next.js dashboard.

## Stack

- **Backend**: Express + TypeScript, BullMQ (Redis-backed queue), Prisma → PostgreSQL
  (Supabase), Ethereal for fake SMTP.
- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS v4, Supabase Auth
  (Google OAuth) for login.
- **Infra**: Redis via Docker for local dev.

## Running it locally

### 1. Redis

```bash
docker compose up -d redis
```

### 2. Backend

```bash
cd backend
cp .env.example .env       # fill in DATABASE_URL/DIRECT_URL (Supabase), SUPABASE_JWT_SECRET,
                            # ETHEREAL_USER/PASS (generate at https://ethereal.email), etc.
npm install
npx prisma migrate dev
npm run dev                # API on :4000
```

In a second terminal, start the queue worker as its own process (this is what makes
restart-survival possible — kill/restart the worker independently of the API):

```bash
npm run dev:worker
```

Add at least one sender before scheduling anything:

```bash
curl -X POST http://localhost:4000/api/senders -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","name":"You"}'
```

(This one call doesn't need auth in dev, but every other `/api/*` route does — see
Auth below.)

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local   # fill in Supabase project URL/anon key
npm install
npm run dev                        # http://localhost:3000
```

Enable the Google provider under Supabase → Authentication → Providers, and add
`http://localhost:3000/auth/callback` as an allowed redirect URL.

## Architecture

### Scheduling (no cron)

Scheduling an email inserts a `ScheduledEmail` row in Postgres, then enqueues a BullMQ
delayed job (`delay: scheduledFor - now`) in the `email-send` queue, using the row's
`id` as the job's `jobId`. The job just sits in Redis until its delay elapses — there's
no polling loop or cron tick driving this.

### Persistence across restarts

Delayed jobs live in Redis (persisted via `appendonly yes`), so killing/restarting
either the API or the worker process doesn't lose them. Two extra layers make sure
nothing falls through the cracks:

- **BullMQ's stalled-job recovery** (`stalledInterval`/`maxStalledCount`) retries a job
  automatically if the worker holding its lock dies mid-processing.
- **A reconciliation sweep** (`backend/src/services/reconcile.ts`) runs on worker boot
  and every 5 minutes: it finds `SCHEDULED` rows past their time with no matching
  Redis job (e.g. the original `queue.add()` call failed after the DB write committed)
  or `PROCESSING` rows stuck for too long, and re-enqueues them.

### Idempotency

Two independent checks prevent double-sends:
1. BullMQ dedupes on `jobId` (the row's own id) — re-adding the same job is a no-op.
2. The worker re-checks the row's `status` before processing, and atomically claims it
   with `UPDATE ... WHERE status = 'SCHEDULED'` before sending. Any retried/duplicated
   job attempt sees a `status` that's no longer `SCHEDULED` and short-circuits.

### Rate limiting & concurrency

- **Worker concurrency**: `WORKER_CONCURRENCY` env var, passed straight into BullMQ's
  `Worker` options.
- **Minimum delay between sends**: a Redis key per sender (`rl:lastsent:{senderId}`)
  set with `SET NX PX <minDelayMs>`. If a job is processed before that key expires, the
  minimum delay hasn't passed yet.
- **Emails per hour**: a Redis counter per sender per hour bucket
  (`rl:hour:{senderId}:{YYYYMMDDHH}`), incremented atomically and expired after ~1
  hour. Both are Redis-backed (not in-memory), so they're safe across multiple worker
  processes.
- **What happens when a limit is hit**: the job is never dropped or failed. The worker
  calls `job.moveToDelayed(...)` to push it to the next hour boundary (for the hourly
  limit) or to just after the delay window closes (for the minimum delay), and reverts
  the row back to `SCHEDULED` in the meantime. This is also how a burst of 1000+ emails
  scheduled at once behaves — every job still gets a cheap delayed slot in Redis, and
  the rate limiter naturally spreads the actual sends out over time instead of erroring.

## Features implemented

**Backend**: schedule API (single + CSV batch), scheduled/sent listing with pagination,
BullMQ delayed-job scheduling, worker concurrency, per-sender min-delay and hourly rate
limiting (Redis-backed, configurable via env, never drops jobs), idempotent job
processing, restart-persistence via BullMQ + a reconciliation sweep, Supabase JWT auth
middleware, CSV/txt recipient list upload and parsing.

**Frontend**: Google OAuth login via Supabase Auth, dashboard with Scheduled/Sent tabs
(loading + empty states, search), Compose panel (sender selection, recipient chips +
CSV upload, subject, rich-text body, configurable delay/hourly-limit, Send Later date
picker with quick-picks), toast notifications.

## Assumptions & trade-offs

- Email/password login is wired via Supabase Auth but is a secondary path — Google
  OAuth is the required "real" auth flow per the assignment.
- The rich-text editor is a lightweight `contentEditable` + toolbar rather than a full
  editor library, to keep the bundle and build time small.
- The optional "open a full email thread" view from the Figma file wasn't built — it's
  not part of the written requirements, and the two required tables (Scheduled/Sent)
  were prioritized instead.
- Local dev uses Docker Redis; a hosted Redis (e.g. Upstash) would be a one-line
  `REDIS_URL` change for a real deployment.
