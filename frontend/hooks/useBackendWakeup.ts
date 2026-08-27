"use client";

import { useEffect, useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL!;
// Free Render instances take roughly this long to come back from idle.
const EXPECTED_WAKE_MS = 50_000;
// Below this, the API answered quickly enough that nobody needs to see a loader.
const QUIET_MS = 1_200;
const RETRY_MS = 2_500;

export interface WakeState {
  waking: boolean;
  /** 0-1, only meaningful while waking. Eases off as it approaches the estimate. */
  progress: number;
}

/** Watches for a sleeping backend and reports how far along the wake-up is.
 *  Free hosting idles the API out, and a cold start looks like a broken app unless
 *  you say what's happening. */
export function useBackendWakeup(): WakeState {
  const [waking, setWaking] = useState(false);
  const [progress, setProgress] = useState(0);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout>;
    let tickTimer: ReturnType<typeof setInterval>;

    const slowEnoughToShow = setTimeout(() => {
      if (cancelled) return;
      startedAt.current = Date.now();
      setWaking(true);

      tickTimer = setInterval(() => {
        const elapsed = Date.now() - (startedAt.current ?? Date.now());
        // Approach 95% asymptotically — never claim finished until the API actually
        // answers, or a stalled bar would sit at 100% looking broken.
        setProgress(1 - Math.exp(-elapsed / (EXPECTED_WAKE_MS / 3)) * 0.95 - 0.05);
      }, 250);
    }, QUIET_MS);

    async function ping(): Promise<void> {
      try {
        const res = await fetch(`${API}/api/health`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        if (cancelled) return;
        clearTimeout(slowEnoughToShow);
        clearInterval(tickTimer);
        setProgress(1);
        // Let a completed bar register before it disappears.
        setTimeout(() => !cancelled && setWaking(false), 400);
      } catch {
        if (cancelled) return;
        retryTimer = setTimeout(ping, RETRY_MS);
      }
    }

    ping();

    return () => {
      cancelled = true;
      clearTimeout(slowEnoughToShow);
      clearTimeout(retryTimer);
      clearInterval(tickTimer);
    };
  }, []);

  return { waking, progress: Math.min(Math.max(progress, 0), 1) };
}
