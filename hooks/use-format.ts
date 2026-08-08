"use client";

import { useMemo } from "react";
import { useUnits } from "@/hooks/use-units";
import { paceToSeconds, secondsToPace } from "@/lib/pace";
import {
  distanceUnit,
  elevationUnit,
  formatDistance,
  formatDistanceValue,
  formatTemp,
  paceSecondsFor,
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

  /** Stored pace (per km) -> "8:00" (no unit). */
  paceValue: (pace?: string | null) => string;
  /** Stored pace (per km) -> "8:00/mi". */
  pace: (pace?: string | null) => string;

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

      paceValue: (pace) => {
        if (!pace) return "—";
        const secs = paceToSeconds(pace);
        // Free-form text the parser doesn't recognise is passed through rather
        // than mangled — converting something we can't read would invent data.
        if (secs == null) return pace;
        return secondsToPace(paceSecondsFor(secs, units));
      },
      pace: (pace) => {
        if (!pace) return "—";
        const secs = paceToSeconds(pace);
        if (secs == null) return pace;
        return `${secondsToPace(paceSecondsFor(secs, units))}${paceUnit(units)}`;
      },

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
