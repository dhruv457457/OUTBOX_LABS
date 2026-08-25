import type { EmailAttachment } from "@/lib/types";

function formatBytes(base64: string) {
  const bytes = Math.round((base64.length * 3) / 4);
  return bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function AttachmentPreview({ value, onRemove }: { value: EmailAttachment[]; onRemove: (i: number) => void }) {
  if (value.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {value.map((a, i) => {
        const isImage = a.contentType.startsWith("image/");
        return (
          <div key={`${a.filename}-${i}`} className="group relative w-28 overflow-hidden rounded-lg border border-border bg-surface">
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`data:${a.contentType};base64,${a.content}`} alt={a.filename} className="h-20 w-full object-cover" />
            ) : (
              <div className="flex h-20 w-full items-center justify-center bg-black/[0.03]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-muted">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinejoin="round" />
                  <path d="M14 2v6h6" strokeLinejoin="round" />
                </svg>
              </div>
            )}
            <div className="px-1.5 py-1">
              <p className="truncate text-[11px] font-medium">{a.filename}</p>
              <p className="text-[10px] text-muted">{formatBytes(a.content)}</p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(i)}
              aria-label={`remove ${a.filename}`}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
