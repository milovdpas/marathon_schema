// Cache-first weather client. Hits the same-origin /api/weather/* proxy (which
// holds the key) only on a cache miss, and coalesces concurrent identical calls.
import { fromISO, toISO } from "@/lib/date";
import type { WeatherSnapshot } from "@/lib/types";
import { coordKey, readCache, writeCache } from "@/lib/weather-cache";

const DAY_MS = 86_400_000;

/** Immutable past days cache ~forever; today/future is short-lived. */
function ttlFor(iso: string): number {
  return fromISO(iso).getTime() < Date.now() - DAY_MS
    ? 365 * DAY_MS
    : 3 * 60 * 60 * 1000;
}

const inflight = new Map<string, Promise<unknown>>();
function once<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const p = fn().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

// After a failed weather call (401 not-subscribed, 429 quota, network), pause
// network fetches briefly so we don't hammer the API or spam the console.
let cooldownUntil = 0;
const inCooldown = () => Date.now() < cooldownUntil;
const tripCooldown = () => {
  cooldownUntil = Date.now() + 60_000;
};

export async function fetchWeatherStatus(): Promise<{ configured: boolean }> {
  try {
    const res = await fetch("/api/weather/status", { cache: "no-store" });
    if (!res.ok) return { configured: false };
    return res.json();
  } catch {
    return { configured: false };
  }
}

export type LocationResult =
  | { lat: number; lon: number }
  | "denied"
  | "unavailable";

export async function getCurrentLocation(): Promise<LocationResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return "unavailable";
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) =>
        resolve(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60_000 },
    );
  });
}

/** Day weather for the 7 days from `weekStartISO`. One `daily` call on a miss. */
export async function getWeekWeather(
  lat: number,
  lon: number,
  weekStartISO: string,
): Promise<Record<string, WeatherSnapshot>> {
  const ck = coordKey(lat, lon);
  const isos = Array.from({ length: 7 }, (_, i) =>
    toISO(new Date(fromISO(weekStartISO).getTime() + i * DAY_MS)),
  );
  const result: Record<string, WeatherSnapshot> = {};
  const missing: string[] = [];
  for (const iso of isos) {
    const cached = readCache(`${ck}:${iso}`);
    if (cached) result[iso] = cached;
    else missing.push(iso);
  }
  if (missing.length === 0 || inCooldown()) return result;

  const startUnix = Math.floor(fromISO(weekStartISO).getTime() / 1000);
  await once(`daily:${ck}:${weekStartISO}`, async () => {
    const res = await fetch(
      `/api/weather/daily?lat=${lat}&lon=${lon}&start=${startUnix}`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      tripCooldown();
      return;
    }
    const { days } = (await res.json()) as { days: WeatherSnapshot[] };
    for (const snap of days ?? []) {
      const iso = toISO(new Date(snap.observedAt));
      writeCache(`${ck}:${iso}`, snap, ttlFor(iso));
      if (isos.includes(iso)) result[iso] = snap;
    }
  });
  return result;
}

/** Weather for one day, at a precise finish time when given + in hourly range. */
export async function getDayWeather(
  lat: number,
  lon: number,
  iso: string,
  finishTime?: string,
): Promise<WeatherSnapshot | null> {
  const ck = coordKey(lat, lon);

  if (finishTime && /^\d{2}:\d{2}$/.test(finishTime)) {
    const key = `${ck}:${iso}:${finishTime}`;
    const cached = readCache(key);
    if (cached) return cached;
    const dt = Math.floor(new Date(`${iso}T${finishTime}:00`).getTime() / 1000);
    const snap = inCooldown()
      ? null
      : await once(`hourly:${key}`, async () => {
          const res = await fetch(
            `/api/weather/hourly?lat=${lat}&lon=${lon}&dt=${dt}`,
            { cache: "no-store" },
          );
          if (!res.ok) {
            tripCooldown();
            return null;
          }
          const { snapshot } = (await res.json()) as {
            snapshot: WeatherSnapshot | null;
          };
          return snapshot;
        });
    if (snap) {
      writeCache(key, snap, ttlFor(iso));
      return snap;
    }
    // fall through to the day-level value
  }

  const dayKey = `${ck}:${iso}`;
  const cached = readCache(dayKey);
  if (cached) return cached;
  const week = await getWeekWeather(lat, lon, iso);
  return week[iso] ?? null;
}
