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

/** Derive duration (minutes) from distance (km) and pace ("mm:ss"). */
export function durationFromDistancePace(
  distanceKm?: number,
  pace?: string,
): number | undefined {
  const secs = paceToSeconds(pace);
  if (!distanceKm || secs == null) return undefined;
  return Math.round((distanceKm * secs) / 60);
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
