import type { Sender } from "@/lib/types";

export function SenderDropdown({
  senders,
  value,
  onChange,
}: {
  senders: Sender[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted">From</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        {senders.map((s) => (
          <option key={s.id} value={s.id}>
            {s.email}
          </option>
        ))}
      </select>
    </div>
  );
}
