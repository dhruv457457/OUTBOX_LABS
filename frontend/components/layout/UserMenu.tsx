"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export function UserMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const name = user.user_metadata?.full_name ?? user.email?.split("@")[0];
  const avatar = user.user_metadata?.avatar_url as string | undefined;

  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg border border-border px-2 py-2 text-left hover:bg-black/5 dark:hover:bg-white/5"
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="h-8 w-8 rounded-full" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
            {name?.[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          <button onClick={logout} className="w-full px-3 py-2 text-left text-sm text-danger hover:bg-black/5 dark:hover:bg-white/5">
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
