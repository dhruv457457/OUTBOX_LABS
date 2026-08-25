"use client";

import { EmailList } from "@/components/emails/EmailList";
import { useEmailList } from "@/hooks/useEmailList";

export default function ScheduledPage() {
  const { rows, loading } = useEmailList("scheduled");
  return <EmailList rows={rows} loading={loading} kind="scheduled" />;
}
