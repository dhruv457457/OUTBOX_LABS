"use client";

import { useRef } from "react";
import type { EmailAttachment } from "@/lib/types";

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const MAX_SIZE = 5 * 1024 * 1024;

export function AttachmentPicker({
  value,
  onChange,
}: {
  value: EmailAttachment[];
  onChange: (v: EmailAttachment[]) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter((f) => f.size <= MAX_SIZE);
    const encoded = await Promise.all(
      files.map(async (f) => ({
        filename: f.name,
        contentType: f.type || "application/octet-stream",
        content: await readAsBase64(f),
      })),
    );
    onChange([...value, ...encoded]);
    e.target.value = "";
  }

  return (
    <>
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        className="text-muted transition-colors hover:text-foreground"
        aria-label="attach file"
        title="Attach file"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m21.4 11.5-8.5 8.5a4.95 4.95 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3l7.9-7.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <input ref={fileInput} type="file" multiple className="hidden" onChange={handleFiles} />
    </>
  );
}
