"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { apiPost } from "@/lib/apiClient";
import type { ImproveDraftResponse } from "@/lib/types";

export function ToolbarButton({
  icon,
  label,
  active,
  onClick,
  children,
}: {
  icon?: string;
  label: string;
  active?: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-7 min-w-7 items-center justify-center rounded px-1 transition-colors ${
        active ? "bg-primary-soft text-primary" : "text-muted hover:bg-black/5"
      }`}
    >
      {icon ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d={icon} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        children
      )}
    </button>
  );
}

/** Closes the popover when clicking anywhere outside it. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, close]);
  return ref;
}

const fontSizes = [
  { label: "Small", value: "12px" },
  { label: "Normal", value: "" },
  { label: "Large", value: "18px" },
  { label: "Huge", value: "24px" },
];

export function FontSizeSelect({ editor }: { editor: Editor }) {
  const current = (editor.getAttributes("textStyle").fontSize as string | undefined) ?? "";

  return (
    <select
      value={current}
      onChange={(e) => {
        const size = e.target.value;
        const chain = editor.chain().focus();
        if (size) chain.setFontSize(size).run();
        else chain.unsetFontSize().run();
      }}
      title="Font size"
      aria-label="Font size"
      className="h-7 rounded border-none bg-transparent px-1 text-xs text-muted outline-none hover:bg-black/5"
    >
      {fontSizes.map((f) => (
        <option key={f.label} value={f.value}>
          {f.label}
        </option>
      ))}
    </select>
  );
}

const palette = ["#14171a", "#16a34a", "#2563eb", "#dc2626", "#f59e0b", "#7c3aed", "#6b7280"];

export function ColorPicker({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const current = (editor.getAttributes("textStyle").color as string | undefined) ?? "#14171a";

  return (
    <div className="relative" ref={ref}>
      <ToolbarButton label="Text colour" active={open} onClick={() => setOpen((v) => !v)}>
        <span className="flex flex-col items-center leading-none">
          <span className="text-[11px] font-semibold">A</span>
          <span className="mt-0.5 h-1 w-3.5 rounded-sm" style={{ backgroundColor: current }} />
        </span>
      </ToolbarButton>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 flex w-max gap-1 rounded-lg border border-border bg-surface p-2 shadow-lg">
          {palette.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Colour ${color}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                editor.chain().focus().setColor(color).run();
                setOpen(false);
              }}
              className="h-5 w-5 rounded-full border border-border transition-transform hover:scale-110"
              style={{ backgroundColor: color }}
            />
          ))}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              editor.chain().focus().unsetColor().run();
              setOpen(false);
            }}
            className="ml-1 rounded px-1.5 text-xs text-muted hover:bg-black/5"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}

export function LinkButton({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [href, setHref] = useState("");
  const ref = useDismiss(open, () => setOpen(false));
  const active = editor.isActive("link");

  function apply() {
    const url = href.trim();
    if (!url) return;
    // Bare domains would otherwise resolve relative to our own origin.
    const normalised = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href: normalised }).run();
    setHref("");
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <ToolbarButton
        label={active ? "Edit link" : "Add link"}
        icon="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"
        active={active || open}
        onClick={() => {
          if (active) {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
          }
          setHref((editor.getAttributes("link").href as string) ?? "");
          setOpen((v) => !v);
        }}
      />

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 flex w-64 gap-1 rounded-lg border border-border bg-surface p-2 shadow-lg">
          <input
            autoFocus
            value={href}
            onChange={(e) => setHref(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                apply();
              }
            }}
            placeholder="example.com"
            className="min-w-0 flex-1 rounded border border-border px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={apply}
            className="rounded bg-primary px-2 text-xs font-medium text-white"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

/** Sends the current draft to the assistant and swaps in the polished version.
 *  The replacement goes through the editor's history, so Ctrl+Z undoes it. */
export function ImproveButton({
  editor,
  subject,
  senderName,
  onSubjectChange,
  onError,
  onDone,
}: {
  editor: Editor;
  subject?: string;
  senderName?: string;
  onSubjectChange?: (s: string) => void;
  onError: (message: string) => void;
  onDone?: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function improve() {
    if (editor.isEmpty) {
      onError("Write a rough draft first, then let the assistant tidy it up.");
      return;
    }

    setBusy(true);
    try {
      const result = await apiPost<ImproveDraftResponse>("/api/ai/improve", {
        subject,
        senderName,
        bodyHtml: editor.getHTML(),
      });
      editor.chain().focus().setContent(result.bodyHtml).run();
      if (result.subject) onSubjectChange?.(result.subject);
      onDone?.();
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={improve}
      disabled={busy}
      title="Improve this draft"
      aria-label="Improve this draft"
      className="flex h-7 items-center gap-1 rounded px-1.5 text-primary transition-colors hover:bg-primary-soft disabled:opacity-50"
    >
      {busy ? (
        <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M5 3v4M3 5h4M6 17v4m-2-2h4M13 3l2.3 5.7L21 11l-5.7 2.3L13 19l-2.3-5.7L5 11l5.7-2.3L13 3Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span className="text-xs font-medium">{busy ? "Polishing" : "Improve"}</span>
    </button>
  );
}
