"use client";

import { useFormat } from "@/hooks/use-format";
import { paceToSeconds } from "@/lib/pace";
import type { WorkoutSplit } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Strava-style split rows: index · bar · pace · elevation.
 *
 * Splits are stored per kilometer whatever the user's units, because that is
 * how they were scanned off the screenshot. Only the pace and elevation are
 * converted — re-bucketing kilometer splits into miles would mean inventing
 * data points that were never measured.
 */
export function SplitsList({
  splits,
  className,
}: {
  splits: WorkoutSplit[];
  className?: string;
}) {
  const fmt = useFormat();
  if (splits.length === 0) return null;

  const secs = splits
    .map((s) => paceToSeconds(s.pace))
    .filter((n): n is number => n != null);
  const fastest = Math.min(...secs);
  const slowest = Math.max(...secs);
  const span = Math.max(1, slowest - fastest);

  return (
    <div className={cn("space-y-1", className)}>
      {splits.map((s, i) => {
        const sec = paceToSeconds(s.pace);
        // Fastest km gets the longest bar, like Strava.
        const pct = sec == null ? 0 : 30 + (1 - (sec - fastest) / span) * 70;
        return (
          <div key={`${s.km}-${i}`} className="flex items-center gap-2 text-xs">
            <span className="w-7 shrink-0 tabular-nums text-muted-foreground">
              {s.km}
            </span>
            <span className="w-9 shrink-0 font-medium tabular-nums">
              {fmt.paceValue(s.pace)}
            </span>
            <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-primary/70"
                style={{ width: `${pct}%` }}
              />
            </span>
            {s.elevM != null ? (
              <span className="w-8 shrink-0 text-right tabular-nums text-muted-foreground">
                {fmt.elevationNumber(s.elevM) > 0
                  ? `+${fmt.elevationNumber(s.elevM)}`
                  : fmt.elevationNumber(s.elevM)}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
