"use client";

import { useState } from "react";
import { EmailRow } from "./EmailRow";
import { DataList } from "@/components/ui/DataList";
import { useEmailLists } from "@/hooks/useEmailLists";
import type { EmailListState } from "@/hooks/useEmailLists";
import type { ScheduledEmailRow } from "@/lib/types";

type Kind = "scheduled" | "sent";

const statusFilters: Record<Kind, string[]> = {
  scheduled: ["All", "Scheduled", "Processing"],
  sent: ["All", "Sent", "Failed"],
};

const emptyCopy: Record<Kind, { title: string; subtitle: string }> = {
  scheduled: { title: "Nothing scheduled yet", subtitle: "Compose an email to see it here." },
  sent: { title: "No emails sent yet", subtitle: "Sent emails will show up here." },
};

export function EmailList({ state, kind }: { state: EmailListState; kind: Kind }) {
  const { refresh, loadMore } = useEmailLists();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [filterOpen, setFilterOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);

  const filtered = state.rows
    .filter((r) => status === "All" || r.status.toLowerCase() === status.toLowerCase())
    .filter((r) => {
      const q = query.toLowerCase();
      return !q || r.recipient.toLowerCase().includes(q) || r.subject.toLowerCase().includes(q);
    });

  function handleRefresh() {
    setSpinning(true);
    refresh();
    setTimeout(() => setSpinning(false), 500);
  }

  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3-3" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setFilterOpen((v) => !v)}
            aria-label="filter"
            className={`flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors ${
              status !== "All" ? "bg-primary-soft text-primary" : "text-muted hover:bg-black/5"
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
            </svg>
          </button>
          {filterOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg">
              {statusFilters[kind].map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setStatus(opt);
                    setFilterOpen(false);
                  }}
                  className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-black/5 ${status === opt ? "font-medium text-primary" : ""}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleRefresh}
          aria-label="refresh"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted hover:bg-black/5"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={spinning ? "animate-spin" : ""}>
            <path d="M3 12a9 9 0 0 1 15.3-6.4L21 8M3 12a9 9 0 0 0 15.3 6.4L21 16M21 8V3M21 16v5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <DataList<ScheduledEmailRow>
        items={filtered}
        loading={state.loading}
        error={state.error}
        onRetry={refresh}
        empty={emptyCopy[kind]}
        keyOf={(row) => row.id}
        renderRow={(row) => <EmailRow email={row} showTime={kind === "scheduled"} />}
        hasMore={state.hasMore}
        loadingMore={state.loadingMore}
        onLoadMore={() => loadMore(kind)}
        shownOf={state.total > state.rows.length ? { shown: state.rows.length, total: state.total } : undefined}
      />
    </div>
  );
}
