import { format } from "date-fns";
import type { EmailStatus } from "@/lib/types";

export function TimePill({ date }: { date: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-orange-soft px-2.5 py-1 text-xs font-medium text-accent-orange">
      {format(new Date(date), "EEE h:mm a")}
    </span>
  );
}

const statusStyle: Record<EmailStatus, string> = {
  SENT: "bg-primary-soft text-primary",
  FAILED: "bg-red-100 text-danger dark:bg-red-950/40",
  SCHEDULED: "bg-accent-orange-soft text-accent-orange",
  PROCESSING: "bg-accent-orange-soft text-accent-orange",
};

export function StatusPill({ status }: { status: EmailStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle[status]}`}>
      {status === "PROCESSING" ? "Sending" : status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
