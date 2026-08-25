"use client";

import { EmailList } from "@/components/emails/EmailList";
import { useEmailList } from "@/hooks/useEmailList";

export default function SentPage() {
  const { rows, loading } = useEmailList("sent");
  return <EmailList rows={rows} loading={loading} kind="sent" />;
}
