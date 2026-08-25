"use client";

import { useEffect, type ReactNode } from "react";

interface Props {
  onClose: () => void;
  children: ReactNode;
  /** Full-screen centred dialog with a backdrop, vs. a docked bottom-right window. */
  expanded?: boolean;
}

export function Modal({ onClose, children, expanded = false }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {expanded && <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />}
      <div
        role="dialog"
        aria-modal={expanded}
        className={
          expanded
            ? "animate-fade-in fixed left-1/2 top-1/2 z-50 flex h-[88vh] w-[min(900px,92vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
            : "animate-slide-in-right fixed bottom-0 right-6 z-50 flex h-[85vh] max-h-[640px] w-[560px] flex-col overflow-hidden rounded-t-xl border border-b-0 border-border bg-surface shadow-2xl"
        }
      >
        {children}
      </div>
    </>
  );
}
