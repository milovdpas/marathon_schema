"use client";

import { useEffect, useState } from "react";
import { toISO } from "@/lib/date";
import type { WeatherSnapshot } from "@/lib/types";
import { getWeekWeather } from "@/lib/weather";
import { useTrainingStore } from "@/store/use-training-store";
import { useWeatherStore } from "@/store/use-weather-store";

/**
 * Day-keyed weather for the calendar's visible days. Lazy + cache-first: one
 * `daily` fetch per visible week (cached), only when weather + the calendar
 * toggle are on and a location is known.
 */
export function useCalendarWeather(
  days: Date[],
): Record<string, WeatherSnapshot> {
  const enabled = useTrainingStore(
    (s) => !!s.preferences.weatherEnabled && !!s.preferences.weatherCalendar,
  );
  const configured = useWeatherStore((s) => s.configured);
  const coords = useWeatherStore((s) => s.lastCoords);
  const [map, setMap] = useState<Record<string, WeatherSnapshot>>({});

  const weekStarts: string[] = [];
  for (let i = 0; i < days.length; i += 7) weekStarts.push(toISO(days[i]));
  const key = weekStarts.join(",");

  useEffect(() => {
    if (!enabled || !configured || !coords) return;
    let cancelled = false;
    (async () => {
      for (const ws of weekStarts) {
        const res = await getWeekWeather(coords.lat, coords.lon, ws);
        if (cancelled) return;
        if (Object.keys(res).length) setMap((prev) => ({ ...prev, ...res }));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, configured, coords?.lat, coords?.lon]);

  return enabled && configured ? map : {};
}
