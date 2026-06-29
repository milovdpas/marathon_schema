"use client";

import { CalendarRange, CloudSun, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { WorkoutTypeDot } from "@/components/common/workout-type-badge";
import { WORKOUT_TYPES } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Google-Calendar-style legend strip: what the colours mean + a toggle to show
 * weather on the calendar (only shown when a weather key is configured).
 */
export function CalendarLegend({
  weatherConfigured,
  weatherOn,
  weatherBusy,
  onToggleWeather,
}: {
  weatherConfigured: boolean;
  weatherOn: boolean;
  weatherBusy: boolean;
  onToggleWeather: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
      {WORKOUT_TYPES.map((ty) => (
        <span key={ty} className="inline-flex items-center gap-1">
          <WorkoutTypeDot type={ty} className="size-1.5" />
          {t(`workoutType.${ty}`)}
        </span>
      ))}
      <span className="inline-flex items-center gap-1">
        <span className="size-1.5 rounded-full bg-tempo" />
        {t("calendar.offDayLabel")}
      </span>
      <span className="inline-flex items-center gap-1">
        <CalendarRange className="size-3 text-tempo" />
        {t("workoutRow.flexible")}
      </span>

      {weatherConfigured ? (
        <button
          type="button"
          onClick={onToggleWeather}
          disabled={weatherBusy}
          aria-pressed={weatherOn}
          className={cn(
            "ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium transition-colors disabled:opacity-50",
            weatherOn
              ? "border-primary bg-primary/10 text-primary"
              : "hover:bg-accent",
          )}
        >
          {weatherBusy ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <CloudSun className="size-3" />
          )}
          {t("calendar.weather")}
        </button>
      ) : null}
    </div>
  );
}
