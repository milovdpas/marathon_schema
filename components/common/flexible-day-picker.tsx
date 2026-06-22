"use client";

import { eachDayOfInterval, format } from "date-fns";
import { useTranslation } from "react-i18next";
import { fromISO, toISO } from "@/lib/date";
import { getDateLocale } from "@/lib/date-locale";
import type { Workout } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Day chips for a flexible workout's window — tap to set which day it's done. */
export function FlexibleDayPicker({
  workout,
  onPick,
  className,
}: {
  workout: Workout;
  onPick: (date: string) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  if (!workout.flexible || !workout.windowStart || !workout.windowEnd) return null;

  const days = eachDayOfInterval({
    start: fromISO(workout.windowStart),
    end: fromISO(workout.windowEnd),
  });

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <span className="text-[11px] text-muted-foreground">{t("plan.pickDay")}:</span>
      {days.map((d) => {
        const iso = toISO(d);
        return (
          <button
            key={iso}
            type="button"
            onClick={() => onPick(iso)}
            className={cn(
              "rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors",
              iso === workout.date
                ? "border-primary bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {format(d, "EEE d", { locale: getDateLocale() })}
          </button>
        );
      })}
    </div>
  );
}
