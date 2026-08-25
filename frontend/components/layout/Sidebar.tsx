"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEmailLists } from "@/hooks/useEmailLists";
import { UserMenu } from "./UserMenu";

const navItems = [
  { href: "/dashboard/scheduled", label: "Scheduled" },
  { href: "/dashboard/sent", label: "Sent" },
];

export function Sidebar({ onCompose }: { onCompose: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { scheduled, sent } = useEmailLists();
  const counts: Record<string, number> = { scheduled: scheduled.total, sent: sent.total };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-surface p-4">
      <div className="mb-6 px-1">
        <span className="text-2xl font-black tracking-tighter text-foreground">ONB</span>
      </div>

      {user && <UserMenu user={user} />}

      <button
        onClick={onCompose}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary-soft"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
        Compose
      </button>

      <p className="mt-6 mb-1 px-2 text-xs font-medium uppercase tracking-wide text-muted">Core</p>
      <nav className="flex flex-col gap-0.5">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center justify-between rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                active ? "bg-primary-soft text-primary" : "text-foreground hover:bg-black/5"
              }`}
            >
              {active && <span className="absolute -left-4 top-1/2 h-4 w-1 -translate-y-1/2 rounded-r-full bg-primary" />}
              {item.label}
              <span className={`text-xs ${active ? "text-primary" : "text-muted"}`}>{counts[item.label.toLowerCase()] ?? 0}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
