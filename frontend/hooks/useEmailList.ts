"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import type { EmailListResponse } from "@/lib/types";

export function useEmailList(kind: "scheduled" | "sent") {
  const [data, setData] = useState<EmailListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiFetch<EmailListResponse>(`/api/emails/${kind}`);
      setData(result);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    let cancelled = false;

    apiFetch<EmailListResponse>(`/api/emails/${kind}`)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((err) => !cancelled && setError((err as Error).message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [kind]);

  return { rows: data?.rows ?? [], total: data?.total ?? 0, loading, error, refresh };
}
