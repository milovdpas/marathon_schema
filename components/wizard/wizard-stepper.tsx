"use client";

import { cn } from "@/lib/utils";

/** Progress bar across the wizard's steps. `current` is 1-based. */
export function WizardStepper({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => (
        <div key={label} className="flex flex-1 flex-col gap-1">
          <div
            className={cn(
              "h-1.5 rounded-full",
              i + 1 <= current ? "bg-primary" : "bg-muted",
            )}
          />
          <span
            className={cn(
              "truncate text-[11px]",
              i + 1 === current
                ? "font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
