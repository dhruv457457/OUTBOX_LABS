"use client";

import { useState } from "react";
import { TimePill, StatusPill } from "@/components/ui/Pill";
import { apiPatch } from "@/lib/apiClient";
import type { ScheduledEmailRow } from "@/lib/types";

// The body comes from a contentEditable, so it's full of tags and entities like &nbsp;
// — let the browser parse it rather than trying to regex them away.
function toPlainText(html: string) {
  if (typeof document === "undefined") return html.replace(/<[^>]+>/g, " ");
  const el = document.createElement("div");
  el.innerHTML = html;
  return (el.textContent ?? "").replace(/\s+/g, " ").trim();
}

export function EmailRow({ email, showTime }: { email: ScheduledEmailRow; showTime: boolean }) {
  const [starred, setStarred] = useState(email.starred);

  async function toggleStar() {
    const next = !starred;
    setStarred(next); // optimistic — the row flips immediately, reverts if the call fails
    try {
      await apiPatch(`/api/emails/${email.id}/star`, { starred: next });
    } catch {
      setStarred(!next);
    }
  }
  const preview = toPlainText(email.bodyHtml).slice(0, 70);

  // Scheduled rows count down to their send time; sent rows report when they went out.
  const stamp = showTime ? email.scheduledFor : email.sentAt;

  return (
    <div className="group flex items-center gap-3 border-b border-border px-4 py-3.5 transition-colors hover:bg-black/[0.02]">
      <span className="w-44 shrink-0 truncate text-sm text-foreground" title={email.recipient}>
        To: {email.recipient}
      </span>

      {stamp && <TimePill date={stamp} tone={showTime ? "warning" : "neutral"} />}
      <StatusPill status={email.status} />

      <span className="min-w-0 flex-1 truncate text-sm">
        <span className="font-medium text-foreground">{email.subject}</span>
        {preview && <span className="text-muted"> - {preview}</span>}
      </span>

      {email.previewUrl && (
        <a
          href={email.previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary-soft"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          View email
        </a>
      )}

      <button
        onClick={toggleStar}
        className={`shrink-0 transition-opacity ${starred ? "text-accent-orange opacity-100" : "text-muted opacity-0 hover:text-accent-orange group-hover:opacity-100"}`}
        aria-label={starred ? "unstar" : "star"}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={starred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
          <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9-6.2-3.3-6.2 3.3 1.2-6.9-5-4.9 6.9-1L12 2Z" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
