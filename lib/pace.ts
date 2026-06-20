// Pace helpers. Paces are stored as "mm:ss" strings (per km).

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

/** Pace string formatted with the /km suffix, or em dash. */
export function formatPace(pace?: string | null): string {
  if (!pace) return "—";
  const secs = paceToSeconds(pace);
  if (secs == null) return pace; // free-form fallback
  return `${secondsToPace(secs)}/km`;
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

/** Derive duration (minutes) from distance (km) and pace ("mm:ss"). */
export function durationFromDistancePace(
  distanceKm?: number,
  pace?: string,
): number | undefined {
  const secs = paceToSeconds(pace);
  if (!distanceKm || secs == null) return undefined;
  return Math.round((distanceKm * secs) / 60);
}

/** Format minutes as "1h 23m" or "45m". */
export function formatDuration(minutes?: number | null): string {
  if (minutes == null || minutes <= 0) return "—";
  const total = Math.round(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
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
