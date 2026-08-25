"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Modal } from "@/components/ui/Modal";
import { ComposePanel } from "@/components/compose/ComposePanel";
import { useEmailList } from "@/hooks/useEmailList";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [composeOpen, setComposeOpen] = useState(false);
  const scheduled = useEmailList("scheduled");
  const sent = useEmailList("sent");

  return (
    <div className="flex h-screen">
      <Sidebar
        counts={{ scheduled: scheduled.total, sent: sent.total }}
        onCompose={() => setComposeOpen(true)}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>

      <Modal open={composeOpen} onClose={() => setComposeOpen(false)}>
        <ComposePanel
          onClose={() => setComposeOpen(false)}
          onScheduled={() => {
            scheduled.refresh();
            sent.refresh();
          }}
        />
      </Modal>
    </div>
  );
}
