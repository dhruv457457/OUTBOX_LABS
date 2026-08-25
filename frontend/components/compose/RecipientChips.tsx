"use client";

import { useRef, useState } from "react";
import { apiUpload } from "@/lib/apiClient";
import type { UploadListResponse } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RecipientChips({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function addFromDraft() {
    const email = draft.trim().replace(/,$/, "");
    if (email && EMAIL_RE.test(email) && !value.includes(email)) {
      onChange([...value, email]);
    }
    setDraft("");
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await apiUpload<UploadListResponse>("/api/upload-list", file);
      onChange([...new Set([...value, ...result.emails])]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const visible = value.slice(0, 6);
  const overflow = value.length - visible.length;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">To</span>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
          disabled={uploading}
        >
          {uploading ? "Parsing..." : "Upload List"}
        </button>
        <input ref={fileInput} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-2">
        {visible.map((email) => (
          <span key={email} className="flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary">
            {email}
            <button type="button" onClick={() => onChange(value.filter((v) => v !== email))} aria-label={`remove ${email}`}>
              ×
            </button>
          </span>
        ))}
        {overflow > 0 && <span className="text-xs text-muted">+{overflow}</span>}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addFromDraft();
            }
          }}
          onBlur={addFromDraft}
          placeholder={value.length === 0 ? "recipient@example.com" : ""}
          className="min-w-24 flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      {value.length > 0 && <p className="mt-1 text-xs text-muted">{value.length} recipient{value.length === 1 ? "" : "s"} detected</p>}
    </div>
  );
}
