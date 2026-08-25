"use client";

import { EmailList } from "@/components/emails/EmailList";
import { useEmailLists } from "@/hooks/useEmailLists";

export default function SentPage() {
  const { sent } = useEmailLists();
  return <EmailList state={sent} kind="sent" />;
}
