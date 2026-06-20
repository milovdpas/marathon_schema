"use client";

import { useHydrated } from "@/hooks/use-hydrated";

/** Renders a skeleton until the persisted store has rehydrated. */
export function HydrationGate({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <div className="space-y-4 py-2">
        <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }
  return <>{children}</>;
}
