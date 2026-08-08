// Pace helpers. Paces are **stored** as "mm:ss" strings per km, always, in
// every unit system — see lib/units.ts. Converting to min/mile happens at the
// display edge, in `useFormat()`, never here.

/** Parse "mm:ss" (or "m:ss") into total seconds. Returns null if invalid. */
export function paceToSeconds(pace?: string | null): number | null {
  if (!pace) return null;
  const match = pace.trim().match(/^(\d{1,2}):([0-5]?\d)$/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

/** Format total seconds-per-km as "mm:ss". */
export function secondsToPace(seconds?: number | null): string {
  if (seconds == null || !isFinite(seconds) || seconds <= 0) return "—";
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * A stored pace as a bare "mm:ss", with no unit suffix, or an em dash.
 *
 * Deliberately suffix-free: callers that want "4:58/km" go through
 * `useFormat().pace()`, which knows the user's units. Baking "/km" in here is
 * what forced `complete-workout-dialog` to `.replace("/km", "")` to get a value
 * back out of it.
 */
export function formatPaceValue(pace?: string | null): string {
  if (!pace) return "—";
  const secs = paceToSeconds(pace);
  if (secs == null) return pace; // free-form fallback
  return secondsToPace(secs);
}

/** Parse a total time ("h:mm:ss", "mm:ss", or plain minutes) into minutes. */
export function parseDurationToMinutes(input?: string | null): number | undefined {
  if (!input) return undefined;
  const s = input.trim();
  if (s === "") return undefined;
  if (/^\d+(\.\d+)?$/.test(s)) return parseFloat(s); // plain minutes
  const parts = s.split(":").map((x) => Number(x));
  if (parts.some((n) => Number.isNaN(n))) return undefined;
  let seconds: number;
  if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
  else if (parts.length === 3)
    seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  else return undefined;
  return seconds / 60;
}

/** Derive pace (s/km) from distance (km) and duration (minutes). */
export function paceFromDistanceDuration(
  distanceKm?: number,
  durationMin?: number,
): string | undefined {
  if (!distanceKm || !durationMin || distanceKm <= 0) return undefined;
  const secondsPerKm = (durationMin * 60) / distanceKm;
  return secondsToPace(secondsPerKm);
}

/** Parse a numeric field, returning undefined for anything unusable. */
export function num(v: string): number | undefined {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : undefined;
}

/** The three text inputs a user types when logging a run. */
export interface LoggedRunFields {
  distance: string;
  duration: string;
  pace: string;
}

export interface ResolvedRun {
  /** Values to persist on the Workout. */
  actualDistanceKm?: number;
  durationMin?: number;
  actualPace?: string;
  /** Which field the UI should render as computed-and-locked, if any. */
  computed: "pace" | "duration" | null;
  /** What to show in each input — the computed one is derived, not echoed. */
  paceFieldValue: string;
  durationFieldValue: string;
}

/**
 * Distance plus either duration or pace fills in the third.
 *
 * One function drives both the locked-field display and the save payload. They
 * used to be four separate copies across the two log dialogs, which is exactly
 * how a run gets saved at a pace the user never saw on screen.
 *
 * Duration wins when both are present, since it's the measured value and pace
 * is derived from it.
 */
export function resolveLoggedRun(fields: LoggedRunFields): ResolvedRun {
  const actualDistanceKm = num(fields.distance);
  const durationMin = parseDurationToMinutes(fields.duration);
  const paceSecs = paceToSeconds(fields.pace);

  const hasDuration = fields.duration.trim() !== "" && durationMin != null;
  const hasPace = fields.pace.trim() !== "" && paceSecs != null;

  // `!actualDistanceKm` is deliberately falsy at 0: a zero-distance run has no
  // meaningful pace, so nothing is derived from it.
  const paceComputed = !!actualDistanceKm && hasDuration;
  const durationComputed = !!actualDistanceKm && !hasDuration && hasPace;

  let pace = fields.pace.trim() || undefined;
  let duration = durationMin;
  if (actualDistanceKm) {
    if (durationMin != null) {
      // Keep the user's free-form text if the derivation fails.
      pace = paceFromDistanceDuration(actualDistanceKm, durationMin) ?? pace;
    } else if (pace && paceSecs != null) {
      duration = (paceSecs * actualDistanceKm) / 60;
    }
  }

  return {
    actualDistanceKm,
    durationMin: duration,
    actualPace: pace,
    computed: paceComputed ? "pace" : durationComputed ? "duration" : null,
    paceFieldValue: paceComputed
      ? (paceFromDistanceDuration(actualDistanceKm, durationMin ?? undefined) ?? "")
      : fields.pace,
    durationFieldValue: durationComputed
      ? formatClock(((paceSecs ?? 0) * (actualDistanceKm ?? 0)) / 60)
      : fields.duration,
  };
}

/** Format total minutes as a clock string: "mm:ss" or "h:mm:ss". */
export function formatClock(minutes?: number | null): string {
  if (minutes == null || !isFinite(minutes) || minutes <= 0) return "";
  const totalSec = Math.round(minutes * 60);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/**
 * Given a finish "HH:mm" and a run duration (minutes), return the start "HH:mm".
 * Falls back to the finish time when there's no usable duration. Wraps at midnight.
 */
export function deriveStartTime(
  finishHHmm: string,
  durationMin?: number,
): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(finishHHmm.trim());
  if (!m) return finishHHmm;
  let mins = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  if (durationMin != null && Number.isFinite(durationMin) && durationMin > 0) {
    mins -= Math.round(durationMin);
  }
  mins = ((mins % 1440) + 1440) % 1440;
  const hh = String(Math.floor(mins / 60)).padStart(2, "0");
  const mm = String(mins % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Average pace across runs, weighted by distance. Returns "mm:ss" or "—". */
export function averagePace(
  runs: { distanceKm: number; pace?: string }[],
): string {
  let totalDistance = 0;
  let totalSeconds = 0;
  for (const r of runs) {
    const secs = paceToSeconds(r.pace);
    if (secs == null || r.distanceKm <= 0) continue;
    totalDistance += r.distanceKm;
    totalSeconds += secs * r.distanceKm;
  }
  if (totalDistance === 0) return "—";
  return secondsToPace(totalSeconds / totalDistance);
}
