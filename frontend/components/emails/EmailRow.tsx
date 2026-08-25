import { TimePill, StatusPill } from "@/components/ui/Pill";
import type { ScheduledEmailRow } from "@/lib/types";

export function EmailRow({ email, showTime }: { email: ScheduledEmailRow; showTime: boolean }) {
  const preview = email.bodyHtml.replace(/<[^>]+>/g, " ").trim().slice(0, 80);

  return (
    <div className="flex items-center gap-4 border-b border-border px-4 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
      <span className="w-40 shrink-0 truncate text-sm text-foreground">To: {email.recipient}</span>
      {showTime ? <TimePill date={email.scheduledFor} /> : <StatusPill status={email.status} />}
      <span className="min-w-0 flex-1 truncate text-sm">
        <span className="font-medium text-foreground">{email.subject}</span>
        <span className="text-muted"> - {preview}</span>
      </span>
      <button className="text-muted hover:text-accent-orange" aria-label="star">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9-6.2-3.3-6.2 3.3 1.2-6.9-5-4.9 6.9-1L12 2Z" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
