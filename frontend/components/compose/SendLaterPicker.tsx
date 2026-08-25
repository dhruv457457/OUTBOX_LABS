"use client";

import { useState } from "react";
import { addHours, format, setHours, setMinutes, startOfTomorrow } from "date-fns";
import { Button } from "@/components/ui/Button";

const quickPicks = [
  { label: "Tomorrow, 9:00 AM", get: () => setMinutes(setHours(startOfTomorrow(), 9), 0) },
  { label: "Tomorrow, 10:00 AM", get: () => setMinutes(setHours(startOfTomorrow(), 10), 0) },
  { label: "Tomorrow, 3:00 PM", get: () => setMinutes(setHours(startOfTomorrow(), 15), 0) },
  { label: "In 1 hour", get: () => addHours(new Date(), 1) },
];

export function SendLaterPicker({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button type="button" variant="outline" onClick={() => setOpen((v) => !v)}>
        {format(value, "MMM d, h:mm a")}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-lg border border-border bg-surface p-2 shadow-xl">
          <input
            type="datetime-local"
            className="mb-2 w-full rounded-md border border-border bg-transparent px-2 py-1.5 text-sm"
            value={format(value, "yyyy-MM-dd'T'HH:mm")}
            min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
            onChange={(e) => e.target.value && onChange(new Date(e.target.value))}
          />
          <div className="flex flex-col">
            {quickPicks.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => {
                  onChange(q.get());
                  setOpen(false);
                }}
                className="rounded-md px-2 py-1.5 text-left text-sm hover:bg-black/5 dark:hover:bg-white/5"
              >
                {q.label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex justify-end gap-2 border-t border-border pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" onClick={() => setOpen(false)}>Done</Button>
          </div>
        </div>
      )}
    </div>
  );
}
