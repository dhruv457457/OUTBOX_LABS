"use client";

import { useEffect, useState } from "react";
import { addHours } from "date-fns";
import { apiFetch, apiPost } from "@/lib/apiClient";
import type { Sender } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { RecipientChips } from "./RecipientChips";
import { SenderDropdown } from "./SenderDropdown";
import { RichTextEditor } from "./RichTextEditor";
import { SendLaterPicker } from "./SendLaterPicker";

export function ComposePanel({ onClose, onScheduled }: { onClose: () => void; onScheduled: () => void }) {
  const toast = useToast();
  const [senders, setSenders] = useState<Sender[]>([]);
  const [senderId, setSenderId] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [sendAt, setSendAt] = useState(() => addHours(new Date(), 1));
  const [minDelayMs, setMinDelayMs] = useState(2000);
  const [hourlyLimit, setHourlyLimit] = useState(200);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<Sender[]>("/api/senders").then((rows) => {
      setSenders(rows);
      if (rows[0]) setSenderId(rows[0].id);
    });
  }, []);

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
        minDelayMs,
        hourlyLimit,
      });
      toast(`Scheduled ${recipients.length} email${recipients.length > 1 ? "s" : ""}.`);
      onScheduled();
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
        <button onClick={onClose} className="flex items-center gap-2 text-sm text-muted hover:text-foreground">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Compose New Email
        </button>
        <SendLaterPicker value={sendAt} onChange={setSendAt} />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <SenderDropdown senders={senders} value={senderId} onChange={setSenderId} />
        <RecipientChips value={recipients} onChange={setRecipients} />
        <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />

        <div className="flex gap-4">
          <label className="flex-1 text-sm">
            <span className="mb-1 block text-muted">Delay between 2 emails (ms)</span>
            <Input type="number" min={0} value={minDelayMs} onChange={(e) => setMinDelayMs(Number(e.target.value))} />
          </label>
          <label className="flex-1 text-sm">
            <span className="mb-1 block text-muted">Hourly Limit</span>
            <Input type="number" min={1} value={hourlyLimit} onChange={(e) => setHourlyLimit(Number(e.target.value))} />
          </label>
        </div>

        <RichTextEditor onChange={setBodyHtml} />
      </div>

      <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Scheduling..." : "Schedule"}
        </Button>
      </div>
    </div>
  );
}
