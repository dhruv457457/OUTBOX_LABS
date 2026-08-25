"use client";

import { useRef } from "react";

const commands = [
  { cmd: "bold", label: "B", className: "font-bold" },
  { cmd: "italic", label: "I", className: "italic" },
  { cmd: "underline", label: "U", className: "underline" },
  { cmd: "insertUnorderedList", label: "•", className: "" },
  { cmd: "insertOrderedList", label: "1.", className: "" },
];

export function RichTextEditor({ onChange }: { onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
        {commands.map((c) => (
          <button
            key={c.cmd}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => document.execCommand(c.cmd)}
            className={`h-7 w-7 rounded text-sm text-muted hover:bg-black/5 dark:hover:bg-white/5 ${c.className}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={() => onChange(ref.current?.innerHTML ?? "")}
        className="min-h-40 px-3 py-3 text-sm outline-none [&:empty]:before:text-muted [&:empty]:before:content-['Type_your_message...']"
      />
    </div>
  );
}
