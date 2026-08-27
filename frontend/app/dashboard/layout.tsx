"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { WakingOverlay } from "@/components/layout/WakingOverlay";
import { ComposeModal } from "@/components/compose/ComposeModal";
import { EmailListsProvider } from "@/hooks/useEmailLists";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [composeOpen, setComposeOpen] = useState(false);

  return (
    <EmailListsProvider>
      <div className="flex h-screen">
        <Sidebar onCompose={() => setComposeOpen(true)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      {composeOpen && <ComposeModal onClose={() => setComposeOpen(false)} />}
      <WakingOverlay />
    </EmailListsProvider>
  );
}
