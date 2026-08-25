export function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 6h16v12H4z" strokeLinejoin="round" />
          <path d="m4 7 8 6 8-6" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted">{subtitle}</p>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex flex-col gap-2 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
      ))}
    </div>
  );
}
