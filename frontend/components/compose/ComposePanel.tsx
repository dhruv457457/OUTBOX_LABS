"use client";

import { useEffect, useState } from "react";
import { addHours } from "date-fns";
import { apiFetch, apiPost } from "@/lib/apiClient";
import type { EmailAttachment, Sender } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useEmailLists } from "@/hooks/useEmailLists";
import { useAuth } from "@/hooks/useAuth";
import { RecipientChips } from "./RecipientChips";
import { SenderDropdown } from "./SenderDropdown";
import { RichTextEditor } from "./RichTextEditor";
import { SendLaterPicker } from "./SendLaterPicker";
import { AttachmentPicker } from "./AttachmentPicker";
import { AttachmentPreview } from "./AttachmentPreview";

function FieldIcon({ path }: { path: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface Props {
  onClose: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
}

export function ComposePanel({ onClose, expanded, onToggleExpand }: Props) {
  const toast = useToast();
  const { refresh } = useEmailLists();
  const { user } = useAuth();
  // Sign-offs should carry the person's name, not the mailbox label.
  const signOffName = (user?.user_metadata?.full_name as string | undefined) ?? undefined;
  const [senders, setSenders] = useState<Sender[]>([]);
  const [senderId, setSenderId] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [sendAt, setSendAt] = useState(() => addHours(new Date(), 1));
  const [minDelaySeconds, setMinDelaySeconds] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(200);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Sender[]>("/api/senders")
      .then((rows) => {
        if (cancelled) return;
        setSenders(rows);
        if (rows[0]) setSenderId(rows[0].id);
      })
      .catch((err: Error) => {
        if (!cancelled) toast(`Couldn't load senders: ${err.message}`, "error");
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  async function handleSubmit() {
    if (!senderId || recipients.length === 0 || !subject) {
      toast("Add a sender, at least one recipient, and a subject first.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await apiPost("/api/emails/schedule", {
        senderId,
        recipients,
        subject,
        bodyHtml,
        scheduledFor: sendAt.toISOString(),
        minDelayMs: minDelaySeconds * 1000,
        hourlyLimit,
        attachments,
      });
      toast(`Scheduled ${recipients.length} email${recipients.length > 1 ? "s" : ""}.`);
      refresh();
      onClose();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-medium">Compose New Email</span>
        <div className="flex items-center gap-3">
          <AttachmentPicker value={attachments} onChange={setAttachments} onNotice={toast} />
          <SendLaterPicker value={sendAt} onChange={setSendAt} />
          <button
            onClick={onToggleExpand}
            aria-label={expanded ? "shrink" : "expand"}
            title={expanded ? "Exit full screen" : "Full screen"}
            className="text-muted transition-colors hover:text-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {expanded ? (
                <path d="M9 3v6H3M15 21v-6h6" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M4 10V4h6M20 14v6h-6" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </button>
          <button onClick={onClose} aria-label="close" className="text-muted transition-colors hover:text-foreground">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <SenderDropdown senders={senders} value={senderId} onChange={setSenderId} />
        <RecipientChips value={recipients} onChange={setRecipients} />

        <Input
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="text-base font-medium"
        />

        <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-black/[0.02] p-3">
          <label className="text-sm">
            <span className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
              <FieldIcon path="M12 8v4l3 3M12 3a9 9 0 1 0 9 9" />
              Wait between sends
            </span>
            <p className="mb-1.5 text-xs text-muted">Pace out each send so it doesn&apos;t look automated.</p>
            <div className="relative">
              <Input type="number" min={0} value={minDelaySeconds} onChange={(e) => setMinDelaySeconds(Number(e.target.value))} className="pr-14" />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">sec</span>
            </div>
          </label>
          <label className="text-sm">
            <span className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
              <FieldIcon path="M4 19h16M7 19V9m5 10V5m5 14v-7" />
              Max emails per hour
            </span>
            <p className="mb-1.5 text-xs text-muted">Extra emails wait for the next hour, they&apos;re never skipped.</p>
            <Input type="number" min={1} value={hourlyLimit} onChange={(e) => setHourlyLimit(Number(e.target.value))} />
          </label>
        </div>

        <RichTextEditor
          onChange={setBodyHtml}
          subject={subject}
          senderName={signOffName}
          onSubjectChange={setSubject}
          onNotice={toast}
        />

        <p className="text-xs text-muted">
          Use <code className="rounded bg-black/[0.06] px-1 py-0.5">{"{{firstName}}"}</code> anywhere in the
          subject or body — it&apos;s replaced with each recipient&apos;s name as the email goes out.
        </p>

        <AttachmentPreview value={attachments} onRemove={(i) => setAttachments(attachments.filter((_, j) => j !== i))} />
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <span className="text-xs text-muted">
          {recipients.length > 0 ? `${recipients.length} recipient${recipients.length > 1 ? "s" : ""} · ` : ""}
          sends {sendAt.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            )}
            {submitting ? "Scheduling..." : "Schedule"}
          </Button>
        </div>
      </div>
    </div>
  );
}
