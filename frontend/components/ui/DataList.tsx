import type { ReactNode } from "react";
import { EmptyState, ErrorState, LoadingState } from "./States";
import { Button } from "./Button";

interface Props<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  empty: { title: string; subtitle: string };
  keyOf: (item: T) => string;
  renderRow: (item: T) => ReactNode;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  shownOf?: { shown: number; total: number };
}

/** Renders a list of rows, or whichever of the loading / error / empty states applies.
 *  Keeps every list screen from re-implementing the same branches. */
export function DataList<T>({
  items,
  loading,
  error,
  onRetry,
  empty,
  keyOf,
  renderRow,
  hasMore,
  loadingMore,
  onLoadMore,
  shownOf,
}: Props<T>) {
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (items.length === 0) return <EmptyState {...empty} />;

  return (
    <div>
      {items.map((item) => (
        <div key={keyOf(item)}>{renderRow(item)}</div>
      ))}

      {(hasMore || shownOf) && (
        <div className="flex flex-col items-center gap-2 py-6">
          {shownOf && (
            <p className="text-xs text-muted">
              Showing {shownOf.shown} of {shownOf.total}
            </p>
          )}
          {hasMore && onLoadMore && (
            <Button variant="outline" onClick={onLoadMore} disabled={loadingMore}>
              {loadingMore ? "Loading..." : "Load more"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
