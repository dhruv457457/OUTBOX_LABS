"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserMenu } from "./UserMenu";
import { Button } from "@/components/ui/Button";

const navItems = [
  { href: "/dashboard/scheduled", label: "Scheduled" },
  { href: "/dashboard/sent", label: "Sent" },
];

export function Sidebar({ counts, onCompose }: { counts: Record<string, number>; onCompose: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-surface p-4">
      <div className="mb-6 flex items-center gap-2 px-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
          O
        </div>
        <span className="text-lg font-bold tracking-tight">Outbox</span>
      </div>

      {user && <UserMenu user={user} />}

      <Button onClick={onCompose} variant="outline" className="mt-4 w-full">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Compose
      </Button>

      <p className="mt-6 mb-1 px-2 text-xs font-medium uppercase tracking-wide text-muted">Core</p>
      <nav className="flex flex-col gap-0.5">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                active ? "bg-primary-soft text-primary" : "text-foreground hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              {item.label}
              <span className="text-xs text-muted">{counts[item.label.toLowerCase()] ?? 0}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
