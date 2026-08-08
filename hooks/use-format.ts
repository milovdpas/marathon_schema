"use client";

import { useMemo } from "react";
import { useUnits } from "@/hooks/use-units";
import { paceToSeconds, secondsToPace } from "@/lib/pace";
import {
  DEFAULT_SPORT,
  displayToStoredPace,
  formatSpeed,
  speedUnit,
  storedPaceToDisplay,
  type Sport,
} from "@/lib/sport";
import {
  distanceUnit,
  elevationUnit,
  formatDistance,
  formatDistanceValue,
  formatTemp,
  paceSecondsToStored,
  paceUnit,
  toDisplayDistance,
  toDisplayElevation,
  toStoredDistance,
  type UnitSystem,
} from "@/lib/units";

export interface Format {
  units: UnitSystem;
  /** "km" | "mi" — for field suffixes and axis labels. */
  distanceUnit: string;
  /** "/km" | "/mi". */
  paceUnit: string;
  elevationUnit: string;

  /** Stored km -> "26.2" (no unit). */
  distanceValue: (km: number, decimals?: number) => string;
  /** Stored km -> "26.2 mi". */
  distance: (km: number, decimals?: number) => string;
  /** Stored km -> a number, for charts. */
  distanceNumber: (km: number) => number;

  /**
   * Stored pace (per km) -> the value this sport shows, with no unit.
   * "8:00" running, "32.5" cycling, "1:45" swimming.
   */
  paceValue: (pace?: string | null, sport?: Sport) => string;
  /** Stored pace (per km) -> "8:00/mi", "32.5 km/h", "1:45/100m". */
  pace: (pace?: string | null, sport?: Sport) => string;
  /** The unit label for a sport: "/km", "km/h", "/100m". */
  speedUnitFor: (sport: Sport) => string;
  /** A typed speed, in a sport's own convention -> stored per-km pace. */
  toStoredPaceFor: (input: string, sport: Sport) => string | undefined;

  /** Stored metres -> "328 ft". */
  elevation: (m: number) => string;
  /** Stored metres -> a signed number, for the splits list. */
  elevationNumber: (m: number) => number;

  /** Stored °C -> "54°F". */
  temp: (c: number) => string;

  /** A number the user typed -> km to persist. */
  toStoredDistance: (value: number) => number;
  /** A pace the user typed ("8:00" in their units) -> stored "4:58" per km. */
  toStoredPace: (pace: string) => string;
}

/**
 * Every unit-aware formatter, resolved once for the current user.
 *
 * The point of funnelling all of it through one hook is that a component never
 * decides *whether* to convert — it just asks for a formatted value. Sites that
 * hand-rolled `${km} km` were the ones that silently stayed metric.
 */
export function useFormat(): Format {
  const units = useUnits();

  return useMemo<Format>(
    () => ({
      units,
      distanceUnit: distanceUnit(units),
      paceUnit: paceUnit(units),
      elevationUnit: elevationUnit(units),

      distanceValue: (km, decimals = 1) =>
        formatDistanceValue(km, units, decimals),
      distance: (km, decimals = 1) => formatDistance(km, units, decimals),
      distanceNumber: (km) =>
        Math.round(toDisplayDistance(km, units) * 10) / 10,

      // Sport defaults to running, so every existing call site keeps working
      // and only multi-sport surfaces have to pass one.
      paceValue: (pace, sport = DEFAULT_SPORT) =>
        // Free-form text the parser can't read is passed through rather than
        // mangled: converting something we don't understand would invent data.
        storedPaceToDisplay(pace, sport, units) || "—",
      pace: (pace, sport = DEFAULT_SPORT) => {
        if (!pace) return "—";
        const secs = paceToSeconds(pace);
        if (secs == null) return pace;
        return formatSpeed(secs, sport, units);
      },
      speedUnitFor: (sport) => speedUnit(sport, units),
      toStoredPaceFor: (input, sport) =>
        displayToStoredPace(input, sport, units),

      elevation: (m) => `${toDisplayElevation(m, units)} ${elevationUnit(units)}`,
      elevationNumber: (m) => toDisplayElevation(m, units),

      temp: (c) => formatTemp(c, units),

      toStoredDistance: (value) => toStoredDistance(value, units),
      toStoredPace: (pace) => {
        const secs = paceToSeconds(pace);
        if (secs == null) return pace;
        return secondsToPace(paceSecondsToStored(secs, units));
      },
    }),
    [units],
  );
}
