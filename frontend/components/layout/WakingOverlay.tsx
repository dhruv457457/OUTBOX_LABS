"use client";

import { useBackendWakeup } from "@/hooks/useBackendWakeup";

/** Shown only while the API is cold. Free hosting idles the process out, and without
 *  this the dashboard just looks stuck on its loading skeletons. */
export function WakingOverlay() {
  const { waking, progress } = useBackendWakeup();
  if (!waking) return null;

  const pct = Math.round(progress * 100);

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-fade-in fixed inset-0 z-[60] flex items-center justify-center bg-background/92 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm px-8 text-center">
        <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        <p className="text-base font-medium text-foreground">Waking the server</p>
        <p className="mt-1 text-sm text-muted">
          The API sleeps when idle on the free plan. This takes about a minute the first time.
        </p>

        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs tabular-nums text-muted">{pct}%</p>
      </div>
    </div>
  );
}
