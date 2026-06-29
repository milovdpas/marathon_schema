import "server-only";
import type { WeatherSnapshot } from "@/lib/types";

// OpenWeatherMap One Call API 3.0+/4.0 ("One Call by Call"). Key is server-only.
const BASE = "https://api.openweathermap.org/data/4.0/onecall";

export function isWeatherConfigured(): boolean {
  return !!process.env.OPENWEATHER_API_KEY;
}

type Precip = number | { "1h"?: number };

interface OwmRecord {
  dt: number; // unix seconds
  // hourly: a number; daily: an object { day, min, max, night, eve, morn }
  temp?: number | { day?: number; max?: number; eve?: number; morn?: number; min?: number };
  // present on forecast records; null on historical 1day records
  weather?: { id: number; main: string; description: string; icon: string }[] | null;
  clouds?: number; // %
  rain?: Precip; // mm
  snow?: Precip; // mm
}
interface OwmTimeline {
  data?: OwmRecord[];
}

/** Daily `temp` is an object; hourly `temp` is a number. Normalize to a number. */
function tempNumber(temp: OwmRecord["temp"]): number | null {
  if (typeof temp === "number") return temp;
  if (temp && typeof temp === "object") {
    return temp.day ?? temp.max ?? temp.eve ?? temp.morn ?? temp.min ?? null;
  }
  return null;
}

function precip(p: Precip | undefined): number {
  if (typeof p === "number") return p;
  if (p && typeof p === "object") return p["1h"] ?? 0;
  return 0;
}

/**
 * Historical 1day records have `weather: null`, so derive a condition from
 * precipitation + cloud cover. Returns OWM-style {id, main, icon} that our
 * WeatherBadge maps to an icon.
 */
function deriveCondition(rec: OwmRecord): {
  id: number;
  main: string;
  icon: string;
} {
  if (precip(rec.snow) > 0) return { id: 601, main: "Snow", icon: "13d" };
  if (precip(rec.rain) >= 0.1) return { id: 501, main: "Rain", icon: "10d" };
  const clouds = rec.clouds ?? 0;
  if (clouds <= 10) return { id: 800, main: "Clear", icon: "01d" };
  if (clouds <= 50) return { id: 801, main: "Clouds", icon: "02d" };
  return { id: 804, main: "Clouds", icon: "04d" };
}

async function owmFetch(
  path: string,
  params: Record<string, string | number>,
): Promise<unknown> {
  const search = new URLSearchParams({ units: "metric" });
  for (const [k, v] of Object.entries(params)) search.set(k, String(v));
  search.set("appid", process.env.OPENWEATHER_API_KEY!);
  const res = await fetch(`${BASE}${path}?${search.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    // OWM returns a JSON body like {"cod":401,"message":"..."} — surface it so
    // a 401 ("not subscribed to One Call by Call" / "Invalid API key") is clear.
    let detail = "";
    try {
      detail = (await res.text()).slice(0, 300);
    } catch {
      // ignore
    }
    throw new Error(
      `OWM ${path} failed (${res.status})${detail ? `: ${detail}` : ""}`,
    );
  }
  return res.json();
}

function toSnapshot(
  rec: OwmRecord,
  lat: number,
  lon: number,
  source: WeatherSnapshot["source"],
): WeatherSnapshot {
  const w = rec.weather?.[0] ?? deriveCondition(rec);
  const temp = tempNumber(rec.temp);
  return {
    tempC: temp == null ? null : Math.round(temp * 10) / 10,
    conditionId: w.id,
    condition: w.main,
    icon: w.icon,
    source,
    observedAt: new Date(rec.dt * 1000).toISOString(),
    lat,
    lon,
  };
}

const sourceFor = (unixSec: number): WeatherSnapshot["source"] =>
  unixSec * 1000 < Date.now() ? "historical" : "forecast";

/** A week (~10 records) of daily weather starting at `startUnix` (defaults to now). */
export async function getDaily(
  lat: number,
  lon: number,
  startUnix?: number,
): Promise<WeatherSnapshot[]> {
  const params: Record<string, string | number> = { lat, lon };
  if (startUnix) params.start = startUnix;
  const json = (await owmFetch("/timeline/1day", params)) as OwmTimeline;
  const src = sourceFor(startUnix ?? Math.floor(Date.now() / 1000));
  return (json.data ?? []).map((r) => toSnapshot(r, lat, lon, src));
}

/** Single hourly observation at/just after `dtUnix`. */
export async function getHourly(
  lat: number,
  lon: number,
  dtUnix: number,
): Promise<WeatherSnapshot | null> {
  const json = (await owmFetch("/timeline/1h", {
    lat,
    lon,
    start: dtUnix,
  })) as OwmTimeline;
  const rec = json.data?.[0];
  return rec ? toSnapshot(rec, lat, lon, sourceFor(dtUnix)) : null;
}
