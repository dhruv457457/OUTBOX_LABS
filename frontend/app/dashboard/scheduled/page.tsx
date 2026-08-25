"use client";

import { EmailList } from "@/components/emails/EmailList";
import { useEmailLists } from "@/hooks/useEmailLists";

export default function ScheduledPage() {
  const { scheduled } = useEmailLists();
  return <EmailList state={scheduled} kind="scheduled" />;
}
