import { format, isToday } from "date-fns";
import type { EmailStatus } from "@/lib/types";

/** Times within today drop the date, older ones keep it — same idea as a mail client. */
function formatStamp(date: Date) {
  return isToday(date) ? format(date, "h:mm:ss a") : format(date, "MMM d, h:mm a");
}

export function TimePill({ date, tone = "warning" }: { date: string; tone?: "warning" | "neutral" }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
        tone === "warning" ? "bg-accent-orange-soft text-accent-orange" : "bg-black/5 text-muted"
      }`}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {formatStamp(new Date(date))}
    </span>
  );
}

const statusStyle: Record<EmailStatus, string> = {
  SENT: "bg-primary-soft text-primary",
  FAILED: "bg-red-100 text-danger",
  SCHEDULED: "bg-accent-orange-soft text-accent-orange",
  PROCESSING: "bg-blue-100 text-blue-700",
};

const statusLabel: Record<EmailStatus, string> = {
  SENT: "Sent",
  FAILED: "Failed",
  SCHEDULED: "Scheduled",
  PROCESSING: "Sending",
};

export function StatusPill({ status }: { status: EmailStatus }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle[status]}`}>
      {statusLabel[status]}
    </span>
  );
}
