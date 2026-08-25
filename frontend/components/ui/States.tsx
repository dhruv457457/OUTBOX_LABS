import type { ReactNode } from "react";
import { Button } from "./Button";

export function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <StateShell
      tone="muted"
      icon={
        <>
          <path d="M4 6h16v12H4z" strokeLinejoin="round" />
          <path d="m4 7 8 6 8-6" strokeLinejoin="round" />
        </>
      }
      title={title}
      subtitle={subtitle}
    />
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <StateShell
      tone="danger"
      icon={
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
        </>
      }
      title="Couldn't load your emails"
      subtitle={message}
      action={onRetry && <Button variant="outline" onClick={onRetry}>Try again</Button>}
    />
  );
}

export function LoadingState({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2 p-4">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-14 overflow-hidden rounded-lg bg-black/[0.04] text-black/10">
          <div className="h-full w-full animate-shimmer" />
        </div>
      ))}
    </div>
  );
}

function StateShell({
  icon,
  title,
  subtitle,
  tone,
  action,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  tone: "muted" | "danger";
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
          tone === "danger" ? "bg-red-100 text-danger" : "bg-primary-soft text-primary"
        }`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          {icon}
        </svg>
      </div>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-0.5 max-w-sm text-sm text-muted">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
