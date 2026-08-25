"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ComposePanel } from "./ComposePanel";

export function ComposeModal({ onClose }: { onClose: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Modal onClose={onClose} expanded={expanded}>
      <ComposePanel onClose={onClose} expanded={expanded} onToggleExpand={() => setExpanded((v) => !v)} />
    </Modal>
  );
}
