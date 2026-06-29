"use client";

import { format } from "date-fns";
import { Plus, Umbrella } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { WeatherIcon } from "@/components/calendar/weather-badge";
import { FlexibleDayPicker } from "@/components/common/flexible-day-picker";
import { WorkoutRow } from "@/components/common/workout-row";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fromISO } from "@/lib/date";
import { getDateLocale } from "@/lib/date-locale";
import type { OffDay, WeatherSnapshot, Workout } from "@/lib/types";
import { getDayWeather } from "@/lib/weather";
import { useTrainingStore } from "@/store/use-training-store";
import { useWeatherStore } from "@/store/use-weather-store";

export function DayDetailSheet({
  date,
  workouts,
  flexibleInWindow = [],
  offDay,
  onOpenChange,
  onToggle,
  onEdit,
  onAdd,
  onReschedule,
}: {
  date: string | null;
  workouts: Workout[];
  flexibleInWindow?: Workout[];
  offDay?: OffDay;
  onOpenChange: (open: boolean) => void;
  onToggle: (id: string) => void;
  onEdit: (w: Workout) => void;
  onAdd: (date: string) => void;
  onReschedule: (id: string, date: string) => void;
}) {
  const { t } = useTranslation();
  // Workouts scheduled today + flexible ones whose window covers today.
  const items = [
    ...workouts,
    ...flexibleInWindow.filter((w) => !workouts.some((x) => x.id === w.id)),
  ];

  // Day weather (when the feature is enabled — independent of the calendar toggle).
  const weatherEnabled = useTrainingStore((s) => s.preferences.weatherEnabled);
  const weatherConfigured = useWeatherStore((s) => s.configured);
  const coords = useWeatherStore((s) => s.lastCoords);
  // Keyed by date so a stale snapshot never shows against a different day.
  const [weather, setWeather] = useState<{
    iso: string;
    snap: WeatherSnapshot;
  } | null>(null);

  useEffect(() => {
    if (!date || !weatherEnabled || !weatherConfigured || !coords) return;
    let cancelled = false;
    (async () => {
      const snap = await getDayWeather(coords.lat, coords.lon, date).catch(
        () => null,
      );
      if (!cancelled && snap) setWeather({ iso: date, snap });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, weatherEnabled, weatherConfigured, coords?.lat, coords?.lon]);

  const dayWeather = weather && weather.iso === date ? weather.snap : null;
  return (
    <Sheet open={!!date} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-2xl rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>
            {date
              ? format(fromISO(date), "EEEE d MMMM", { locale: getDateLocale() })
              : ""}
          </SheetTitle>
          <SheetDescription>
            {t("calendar.workoutsScheduled", { count: items.length })}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-2 overflow-y-auto px-4 pb-4">
          {dayWeather ? (
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
              <WeatherIcon id={dayWeather.conditionId} className="size-5" />
              {dayWeather.tempC != null ? (
                <span className="text-sm font-semibold tabular-nums">
                  {Math.round(dayWeather.tempC)}°C
                </span>
              ) : null}
              {dayWeather.condition ? (
                <span className="text-xs text-muted-foreground">
                  {dayWeather.condition}
                </span>
              ) : null}
            </div>
          ) : null}
          {offDay ? (
            <div className="flex items-start gap-2 rounded-lg border border-tempo/30 bg-tempo/10 px-3 py-2">
              <Umbrella className="mt-0.5 size-4 shrink-0 text-tempo" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{offDay.title}</p>
                {offDay.note ? (
                  <p className="text-xs text-muted-foreground">{offDay.note}</p>
                ) : null}
              </div>
            </div>
          ) : null}
          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("calendar.nothingScheduled")}
            </p>
          ) : (
            items.map((w) => (
              <div key={w.id} className="space-y-1.5">
                <WorkoutRow
                  workout={w}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  showDate={false}
                />
                {w.flexible ? (
                  <FlexibleDayPicker
                    workout={w}
                    onPick={(d) => onReschedule(w.id, d)}
                  />
                ) : null}
              </div>
            ))
          )}
          {date ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onAdd(date)}
            >
              <Plus className="size-4" /> {t("calendar.addWorkout")}
            </Button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
