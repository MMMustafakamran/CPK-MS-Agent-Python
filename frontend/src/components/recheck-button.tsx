"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/** Re-runs the server component's probe by refreshing the route. */
export function RecheckButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      className="mt-4 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50 dark:border-slate-600 dark:text-slate-200"
    >
      {isPending ? "Checking…" : "Re-check"}
    </button>
  );
}
