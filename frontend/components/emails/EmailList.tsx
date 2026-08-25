"use client";

import { useState } from "react";
import { EmailRow } from "./EmailRow";
import { EmptyState, LoadingState } from "./EmptyState";
import type { ScheduledEmailRow } from "@/lib/types";

interface Props {
  rows: ScheduledEmailRow[];
  loading: boolean;
  kind: "scheduled" | "sent";
}

export function EmailList({ rows, loading, kind }: Props) {
  const [query, setQuery] = useState("");
  const filtered = query
    ? rows.filter((r) => r.recipient.includes(query) || r.subject.toLowerCase().includes(query.toLowerCase()))
    : rows;

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
      </div>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={kind === "scheduled" ? "Nothing scheduled yet" : "No emails sent yet"}
          subtitle={kind === "scheduled" ? "Compose an email to see it here." : "Sent emails will show up here."}
        />
      ) : (
        <div>
          {filtered.map((row) => (
            <EmailRow key={row.id} email={row} showTime={kind === "scheduled"} />
          ))}
        </div>
      )}
    </div>
  );
}
