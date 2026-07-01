// localStorage cache for weather snapshots — keeps us well under the OWM free
// quota. Keys embed coords rounded to ~1km; callers choose the TTL (short for
// current/near-future, ~permanent for immutable past days).
import type { WeatherSnapshot } from "@/lib/types";

const KEY = "marathon-weather-cache-v1";
const MAX_ENTRIES = 500;

interface Entry {
  snapshot: WeatherSnapshot;
  expiresAt: number;
}
type Store = Record<string, Entry>;

function read(): Store {
  if (typeof localStorage === "undefined") return {};
  try {
    return (JSON.parse(localStorage.getItem(KEY) ?? "{}") as Store) ?? {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // storage full / unavailable — cache is best-effort
  }
}

/** ~1.1km buckets so a neighbourhood shares cache entries (and a bit of privacy). */
export function coordKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

export function readCache(key: string): WeatherSnapshot | null {
  const store = read();
  const e = store[key];
  if (!e) return null;
  if (e.expiresAt < Date.now()) {
    delete store[key];
    write(store);
    return null;
  }
  return e.snapshot;
}

export function writeCache(
  key: string,
  snapshot: WeatherSnapshot,
  ttlMs: number,
): void {
  const store = read();
  store[key] = { snapshot, expiresAt: Date.now() + ttlMs };
  const keys = Object.keys(store);
  if (keys.length > MAX_ENTRIES) {
    keys.sort((a, b) => store[a].expiresAt - store[b].expiresAt);
    for (const k of keys.slice(0, keys.length - MAX_ENTRIES)) delete store[k];
  }
  write(store);
}

// The location's DST-aware UTC offset (seconds), remembered per coordinate + DATE
// so a run is interpreted in the RUN's timezone on THAT date (DST-correct), not
// the browser's.
const TZ_KEY = "marathon-weather-tz-v1";
const TZ_MAX = 500;

export function readTzOffset(coordKey: string, iso: string): number | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const map = JSON.parse(localStorage.getItem(TZ_KEY) ?? "{}") as Record<
      string,
      number
    >;
    const v = map[`${coordKey}:${iso}`];
    return typeof v === "number" ? v : null;
  } catch {
    return null;
  }
}

export function writeTzOffset(
  coordKey: string,
  iso: string,
  offsetSec: number,
): void {
  if (typeof localStorage === "undefined") return;
  try {
    const map = JSON.parse(localStorage.getItem(TZ_KEY) ?? "{}") as Record<
      string,
      number
    >;
    map[`${coordKey}:${iso}`] = offsetSec;
    const keys = Object.keys(map);
    if (keys.length > TZ_MAX) {
      for (const k of keys.slice(0, keys.length - TZ_MAX)) delete map[k];
    }
    localStorage.setItem(TZ_KEY, JSON.stringify(map));
  } catch {
    // best-effort
  }
}

export function pruneExpired(): void {
  const store = read();
  const now = Date.now();
  let changed = false;
  for (const [k, e] of Object.entries(store)) {
    if (e.expiresAt < now) {
      delete store[k];
      changed = true;
    }
  }
  if (changed) write(store);
}
