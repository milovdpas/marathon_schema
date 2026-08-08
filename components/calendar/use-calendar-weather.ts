"use client";

import { useEffect, useState } from "react";
import { chunkWeeks, toISO } from "@/lib/date";
import type { WeatherSnapshot } from "@/lib/types";
import { getWeekWeather } from "@/lib/weather/client";
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
  // Selected as primitives, not as the `lastCoords` object: an optional-chained
  // dep can't be verified by the lint rule, and a fresh object identity each
  // render would refetch on every commit.
  const lat = useWeatherStore((s) => s.lastCoords?.lat);
  const lon = useWeatherStore((s) => s.lastCoords?.lon);
  const [map, setMap] = useState<Record<string, WeatherSnapshot>>({});

  // Joined so the effect depends on the weeks' identity, not the array's.
  const key = chunkWeeks(days)
    .map((w) => toISO(w[0]))
    .join(",");

  useEffect(() => {
    if (!enabled || !configured || lat == null || lon == null) return;
    let cancelled = false;
    (async () => {
      for (const ws of key.split(",")) {
        const res = await getWeekWeather(lat, lon, ws);
        if (cancelled) return;
        if (Object.keys(res).length) setMap((prev) => ({ ...prev, ...res }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, enabled, configured, lat, lon]);

  return enabled && configured ? map : {};
}
