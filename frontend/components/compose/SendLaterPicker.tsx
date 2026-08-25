"use client";

import { useState } from "react";
import DatePicker from "react-datepicker";
import { addHours, format, setHours, setMinutes, startOfTomorrow } from "date-fns";
import { Button } from "@/components/ui/Button";
import "react-datepicker/dist/react-datepicker.css";

const quickPicks = [
  { label: "In 1 minute (testing)", get: () => new Date(Date.now() + 60_000) },
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
        <div className="send-later-picker absolute right-0 top-full z-20 mt-2 flex w-[540px] gap-3 rounded-lg border border-border bg-surface p-3 shadow-xl">
          <div className="w-40 shrink-0 border-r border-border pr-3">
            <p className="mb-1.5 text-xs font-medium text-muted">Quick pick</p>
            <div className="flex flex-col">
              {quickPicks.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => {
                    onChange(q.get());
                    setOpen(false);
                  }}
                  className="rounded-md px-2 py-1.5 text-left text-sm hover:bg-black/5"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <DatePicker
              selected={value}
              onChange={(date: Date | null) => date && onChange(date)}
              showTimeSelect
              timeIntervals={15}
              minDate={new Date()}
              dateFormat="MMM d, yyyy h:mm aa"
              inline
            />
            <div className="mt-2 flex justify-end gap-2 border-t border-border pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="button" onClick={() => setOpen(false)}>Done</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
