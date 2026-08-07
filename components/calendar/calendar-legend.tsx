"use client";

import { CalendarRange, CloudSun, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { WorkoutTypeDot } from "@/components/common/workout-type-badge";
import { WORKOUT_TYPES } from "@/lib/types";
import { cn } from "@/lib/utils";
import { enableWeather } from "@/lib/weather-sync";
import { toast } from "@/store/use-toast-store";
import { useTrainingStore } from "@/store/use-training-store";
import { useWeatherStore } from "@/store/use-weather-store";

/**
 * Google-Calendar-style legend strip: what the colors mean, plus a toggle to
 * show weather on the calendar (only when a weather key is configured).
 *
 * The toggle owns its own state machine. It used to live in the parent view,
 * which meant four props and a 20-line async handler existing purely to feed
 * this one button.
 */
export function CalendarLegend({ className }: { className?: string }) {
  const { t } = useTranslation();
  const setPreferences = useTrainingStore((s) => s.setPreferences);
  const weatherEnabled = useTrainingStore((s) => s.preferences.weatherEnabled);
  const weatherCalendar = useTrainingStore((s) => s.preferences.weatherCalendar);
  const configured = useWeatherStore((s) => s.configured);
  const [busy, setBusy] = useState(false);

  const weatherOn = !!weatherEnabled && !!weatherCalendar;

  // Turning it on enables the feature (location prompt) if needed, then shows
  // weather in the calendar; turning it off just hides it.
  const toggle = async () => {
    if (weatherOn) {
      setPreferences({ weatherCalendar: false });
      return;
    }
    if (weatherEnabled) {
      setPreferences({ weatherCalendar: true });
      return;
    }
    setBusy(true);
    const result = await enableWeather();
    setBusy(false);
    if (result === "ok") setPreferences({ weatherCalendar: true });
    else toast.error(t("weather.locationDenied"));
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground",
        className,
      )}
    >
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

      {configured ? (
        <button
          type="button"
          onClick={() => void toggle()}
          disabled={busy}
          aria-pressed={weatherOn}
          className={cn(
            "ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium transition-colors disabled:opacity-50",
            weatherOn
              ? "border-primary bg-primary/10 text-primary"
              : "hover:bg-accent",
          )}
        >
          {busy ? (
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
