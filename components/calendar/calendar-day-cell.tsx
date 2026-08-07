"use client";

import { format, isToday } from "date-fns";
import { WeatherBadge } from "@/components/calendar/weather-badge";
import {
  TYPE_STYLE,
  WorkoutTypeDot,
} from "@/components/common/workout-type-badge";
import type { WeatherSnapshot, Workout } from "@/lib/types";
import { cn } from "@/lib/utils";

/** One day in the month/week grid. */
export function CalendarDayCell({
  date,
  iso,
  workouts,
  weather,
  mode,
  dimmed,
  onSelect,
}: {
  date: Date;
  /** Passed rather than recomputed — the parent already needs it as a key. */
  iso: string;
  /** Single-day workouts only; flexible ones render as spanning bars. */
  workouts: readonly Workout[];
  weather?: WeatherSnapshot;
  /** Week cells are tall enough to name each session; month cells show dots. */
  mode: "month" | "week";
  /** Outside the anchor month, so faded. */
  dimmed: boolean;
  onSelect: (iso: string) => void;
}) {
  const isWeek = mode === "week";
  const today = isToday(date);

  return (
    <button
      type="button"
      onClick={() => onSelect(iso)}
      className={cn(
        "flex flex-col gap-1 rounded-lg p-1 text-sm transition-colors hover:bg-accent",
        isWeek ? "min-h-28 items-stretch" : "aspect-square items-center",
        dimmed && "text-muted-foreground/40",
        today && "ring-1 ring-primary",
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs tabular-nums",
          isWeek && "self-center",
          today && "bg-primary font-semibold text-primary-foreground",
        )}
      >
        {format(date, "d")}
      </span>

      {isWeek ? (
        <span className="flex min-w-0 flex-col gap-0.5">
          {workouts.map((w) => (
            <span
              key={w.id}
              title={w.title}
              className={cn(
                // A 7th of a phone screen is ~48px, so truncating leaves
                // "Easy…". Wrap to two lines instead and keep the full text in
                // the tooltip.
                "line-clamp-2 break-words rounded px-1 py-0.5 text-left text-[10px] font-medium leading-tight",
                TYPE_STYLE[w.type].badge,
                !w.completed && "opacity-60",
              )}
            >
              {w.title}
            </span>
          ))}
        </span>
      ) : (
        <span className="flex flex-wrap items-center justify-center gap-0.5">
          {workouts.slice(0, 4).map((w) => (
            <WorkoutTypeDot
              key={w.id}
              type={w.type}
              className={cn("size-1.5", !w.completed && "opacity-40")}
            />
          ))}
        </span>
      )}

      {weather ? (
        <WeatherBadge
          snapshot={weather}
          className={cn(isWeek && "mt-auto self-center")}
        />
      ) : null}
    </button>
  );
}
