"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { apiFetch } from "@/lib/apiClient";
import type { EmailListResponse, ScheduledEmailRow } from "@/lib/types";

const PAGE_SIZE = 25;
const POLL_MS = 10_000;

export type ListKind = "scheduled" | "sent";

export interface EmailListState {
  rows: ScheduledEmailRow[];
  total: number;
  page: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
}

interface Ctx {
  scheduled: EmailListState;
  sent: EmailListState;
  refresh: () => void;
  loadMore: (kind: ListKind) => void;
}

const initial: EmailListState = {
  rows: [],
  total: 0,
  page: 1,
  loading: true,
  loadingMore: false,
  error: null,
  hasMore: false,
};

const EmailListsContext = createContext<Ctx | null>(null);

function fetchPage(kind: ListKind, page: number) {
  return apiFetch<EmailListResponse>(`/api/emails/${kind}?page=${page}&pageSize=${PAGE_SIZE}`);
}

export function EmailListsProvider({ children }: { children: ReactNode }) {
  const [scheduled, setScheduled] = useState<EmailListState>(initial);
  const [sent, setSent] = useState<EmailListState>(initial);

  const setters = useRef({ scheduled: setScheduled, sent: setSent }).current;

  // Mirror of the latest state, so timers and callbacks can read it without being
  // re-created on every change.
  const stateRef = useRef({ scheduled, sent });
  stateRef.current = { scheduled, sent };

  /** Reloads the first page, dropping any extra pages the user had loaded. */
  const reload = useCallback(
    (kind: ListKind, silent = false) => {
      const set = setters[kind];
      if (!silent) set((s) => ({ ...s, loading: true, error: null }));

      return fetchPage(kind, 1)
        .then(({ rows, total }) =>
          set({
            rows,
            total,
            page: 1,
            loading: false,
            loadingMore: false,
            error: null,
            hasMore: rows.length < total,
          }),
        )
        .catch((err: Error) => set((s) => ({ ...s, loading: false, error: err.message })));
    },
    [setters],
  );

  const refresh = useCallback(() => {
    reload("scheduled");
    reload("sent");
  }, [reload]);

  const loadMore = useCallback(
    (kind: ListKind) => {
      const current = stateRef.current[kind];
      if (current.loadingMore || !current.hasMore) return;

      const set = setters[kind];
      const nextPage = current.page + 1;
      set((s) => ({ ...s, loadingMore: true }));

      fetchPage(kind, nextPage)
        .then(({ rows, total }) =>
          set((s) => {
            // Skip anything already on screen — a row can shift pages if its status
            // changes between requests.
            const seen = new Set(s.rows.map((r) => r.id));
            const merged = [...s.rows, ...rows.filter((r) => !seen.has(r.id))];
            return { ...s, rows: merged, total, page: nextPage, loadingMore: false, hasMore: merged.length < total };
          }),
        )
        .catch((err: Error) => set((s) => ({ ...s, loadingMore: false, error: err.message })));
    },
    [setters],
  );

  useEffect(() => {
    reload("scheduled");
    reload("sent");
  }, [reload]);

  // Emails move from scheduled to sent on their own, so keep the lists current without
  // making the user hit refresh. Skipped while extra pages are open so we don't yank
  // rows out from under someone who has scrolled.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.hidden) return;
      for (const kind of ["scheduled", "sent"] as const) {
        const s = stateRef.current[kind];
        if (s.page === 1 && !s.loading && !s.loadingMore) reload(kind, true);
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [reload]);

  return (
    <EmailListsContext.Provider value={{ scheduled, sent, refresh, loadMore }}>{children}</EmailListsContext.Provider>
  );
}

export function useEmailLists() {
  const ctx = useContext(EmailListsContext);
  if (!ctx) throw new Error("useEmailLists must be used within EmailListsProvider");
  return ctx;
}
