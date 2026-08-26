"use client";

import { useRef, useState } from "react";
import { apiUpload } from "@/lib/apiClient";
import type { EmailAttachment } from "@/lib/types";

const MAX_BYTES = 10 * 1024 * 1024;

export function AttachmentPicker({
  value,
  onChange,
  onNotice,
}: {
  value: EmailAttachment[];
  onChange: (v: EmailAttachment[]) => void;
  onNotice: (message: string, tone?: "success" | "error") => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const tooBig = files.filter((f) => f.size > MAX_BYTES);
    if (tooBig.length) onNotice(`Skipped ${tooBig.map((f) => f.name).join(", ")} — over 10MB.`, "error");

    const allowed = files.filter((f) => f.size <= MAX_BYTES).slice(0, 5 - value.length);
    if (allowed.length === 0) return;

    setUploading(true);
    try {
      // Files go straight to storage; the email only ever carries a reference.
      const uploaded = await Promise.all(allowed.map((f) => apiUpload<EmailAttachment>("/api/attachments", f)));
      onChange([...value, ...uploaded]);
    } catch (err) {
      onNotice(`Upload failed: ${(err as Error).message}`, "error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        disabled={uploading || value.length >= 5}
        className="text-muted transition-colors hover:text-foreground disabled:opacity-50"
        aria-label="attach file"
        title={value.length >= 5 ? "Five attachments is the limit" : "Attach file"}
      >
        {uploading ? (
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m21.4 11.5-8.5 8.5a4.95 4.95 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3l7.9-7.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <input ref={fileInput} type="file" multiple className="hidden" onChange={handleFiles} />
    </>
  );
}
