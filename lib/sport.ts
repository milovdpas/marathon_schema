// Sports, and the fact that each one talks about speed differently.
//
// `Sport` is **orthogonal to `WorkoutType`**, which is an intensity axis: a
// tempo effort is a tempo effort whether you're running or on a bike. Sport
// picks the icon, intensity picks the colour, so the two multiply instead of
// producing a 15-entry enum nobody can style.
//
// Pace is stored as **seconds per kilometer for every sport**, because one
// canonical number keeps stats, merging and the AI wire format from having to
// learn three representations. That is a storage decision, not a display one:
// nobody says "my bike pace was 1:50/km", so this file converts at the edge.

import { paceToSeconds, secondsToPace } from "@/lib/pace";
import { KM_PER_MILE, type UnitSystem } from "@/lib/units";

export type Sport = "run" | "bike" | "swim";

export const SPORTS: Sport[] = ["run", "bike", "swim"];

/** Absent sport means running: every workout predating multi-sport is a run. */
export const DEFAULT_SPORT: Sport = "run";

export function isSport(v: unknown): v is Sport {
  return typeof v === "string" && (SPORTS as string[]).includes(v);
}

/** Coerce anything (an AI's output, an old export) to a usable sport. */
export function toSport(v: unknown): Sport {
  return isSport(v) ? v : DEFAULT_SPORT;
}

/**
 * How a sport expresses "how fast", which is a convention, not a preference:
 *  - runners say minutes per km/mile,
 *  - cyclists say km/h or mph, never minutes per km,
 *  - swimmers say minutes per 100 m (or 100 yd in a yards pool).
 */
export type PaceStyle = "pace" | "speed" | "per100";

export const PACE_STYLE: Record<Sport, PaceStyle> = {
  run: "pace",
  bike: "speed",
  swim: "per100",
};

/** 100 yards, in km. Short-course-yards pools are the US convention. */
const KM_PER_100YD = 0.09144;
const KM_PER_100M = 0.1;

/** The label after the number: "/km", "km/h", "/100m", … */
export function speedUnit(sport: Sport, units: UnitSystem): string {
  const imperial = units === "imperial";
  switch (PACE_STYLE[sport]) {
    case "speed":
      return imperial ? "mph" : "km/h";
    case "per100":
      return imperial ? "/100yd" : "/100m";
    default:
      return imperial ? "/mi" : "/km";
  }
}

/**
 * Stored seconds-per-km -> the number a user of this sport reads, without its
 * unit. Returns "" for anything unparseable rather than inventing a value.
 */
export function formatSpeedValue(
  secondsPerKm: number | null,
  sport: Sport,
  units: UnitSystem,
): string {
  if (secondsPerKm == null || !isFinite(secondsPerKm) || secondsPerKm <= 0) {
    return "";
  }
  const imperial = units === "imperial";

  switch (PACE_STYLE[sport]) {
    case "speed": {
      // Faster is a BIGGER number here, unlike every other sport — that
      // inversion is the whole reason bikes get their own branch.
      const kmh = 3600 / secondsPerKm;
      const v = imperial ? kmh / KM_PER_MILE : kmh;
      return String(Math.round(v * 10) / 10);
    }
    case "per100": {
      const per = imperial ? KM_PER_100YD : KM_PER_100M;
      return secondsToPace(secondsPerKm * per);
    }
    default:
      return secondsToPace(imperial ? secondsPerKm * KM_PER_MILE : secondsPerKm);
  }
}

/** Value plus unit, e.g. "8:00/mi", "32.5 km/h", "1:45/100m". */
export function formatSpeed(
  secondsPerKm: number | null,
  sport: Sport,
  units: UnitSystem,
): string {
  const value = formatSpeedValue(secondsPerKm, sport, units);
  if (!value) return "—";
  // Speeds read "32.5 km/h"; paces read "8:00/mi" with no space.
  const sep = PACE_STYLE[sport] === "speed" ? " " : "";
  return `${value}${sep}${speedUnit(sport, units)}`;
}

/**
 * What the user typed, in their sport's own convention -> stored seconds per
 * km. The inverse of `formatSpeedValue`; `null` when it can't be read.
 */
export function parseSpeedValue(
  input: string,
  sport: Sport,
  units: UnitSystem,
): number | null {
  const raw = input.trim();
  if (!raw) return null;
  const imperial = units === "imperial";

  switch (PACE_STYLE[sport]) {
    case "speed": {
      const v = parseFloat(raw.replace(",", "."));
      if (!isFinite(v) || v <= 0) return null;
      const kmh = imperial ? v * KM_PER_MILE : v;
      return 3600 / kmh;
    }
    case "per100": {
      const secs = paceToSeconds(raw);
      if (secs == null) return null;
      return secs / (imperial ? KM_PER_100YD : KM_PER_100M);
    }
    default: {
      const secs = paceToSeconds(raw);
      if (secs == null) return null;
      return imperial ? secs / KM_PER_MILE : secs;
    }
  }
}

/** A stored "mm:ss" per-km pace -> the same pace as this sport would show it. */
export function storedPaceToDisplay(
  pace: string | null | undefined,
  sport: Sport,
  units: UnitSystem,
): string {
  if (!pace) return "";
  const secs = paceToSeconds(pace);
  // Free-form text the parser can't read is passed through untouched rather
  // than converted into a number it never meant.
  if (secs == null) return pace;
  return formatSpeedValue(secs, sport, units);
}

/** The reverse: a typed display value -> a stored "mm:ss" per-km pace. */
export function displayToStoredPace(
  input: string,
  sport: Sport,
  units: UnitSystem,
): string | undefined {
  const secondsPerKm = parseSpeedValue(input, sport, units);
  if (secondsPerKm == null) return input.trim() || undefined;
  return secondsToPace(secondsPerKm);
}
