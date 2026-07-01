// Glue between logging a workout and the weather client. Fire-and-forget — it
// never blocks a save, and no-ops unless weather is enabled + configured.
import { getCurrentLocation, getDayWeather } from "@/lib/weather";
import { coordKey, readCache } from "@/lib/weather-cache";
import { useTrainingStore } from "@/store/use-training-store";
import { useWeatherStore } from "@/store/use-weather-store";

function enabled(): boolean {
  return (
    !!useTrainingStore.getState().preferences.weatherEnabled &&
    useWeatherStore.getState().configured
  );
}

/** Last known coords, else ask the browser once (and remember it). */
async function resolveCoords(): Promise<{ lat: number; lon: number } | null> {
  const w = useWeatherStore.getState();
  if (w.lastCoords) return w.lastCoords;
  const loc = await getCurrentLocation();
  if (typeof loc === "string") return null;
  w.setCoords(loc);
  return loc;
}

/**
 * Turn the weather feature on: request location (browser prompt), remember it,
 * flag the preference, and kick off a backfill. Returns the location outcome so
 * callers can surface a denial. Shared by Settings, the calendar legend, and
 * onboarding.
 */
export async function enableWeather(): Promise<"ok" | "denied" | "unavailable"> {
  const loc = await getCurrentLocation();
  if (typeof loc === "string") return loc;
  useWeatherStore.getState().setCoords(loc);
  useTrainingStore.getState().setPreferences({ weatherEnabled: true });
  void backfillFinishedWorkouts();
  return "ok";
}

/** Capture + store weather for a just-logged (or edited) workout in the active plan. */
export async function attachWeather(
  workoutId: string,
  date: string,
  startTime?: string,
): Promise<void> {
  if (!enabled()) return;
  const coords = await resolveCoords();
  if (!coords) return;
  try {
    const snap = await getDayWeather(coords.lat, coords.lon, date, startTime);
    if (snap) useTrainingStore.getState().updateWorkout(workoutId, { weather: snap });
  } catch {
    // network/quota issues are non-fatal
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
let backfillRunning = false;

/**
 * Backfill the day's weather for completed workouts in the active plan that
 * lack it. Lazy + cached: cache hits apply for free; only `maxCalls` genuine
 * (uncached) fetches happen per run, so it sips the shared quota.
 */
export async function backfillFinishedWorkouts(maxCalls = 5): Promise<void> {
  if (backfillRunning || !enabled()) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  const coords = await resolveCoords();
  if (!coords) return;

  backfillRunning = true;
  try {
    const state = useTrainingStore.getState();
    const plan = state.activePlanId ? state.plans[state.activePlanId] : null;
    if (!plan) return;
    const todo = Object.values(plan.workouts).filter(
      (w) => w.completed && !w.weather,
    );
    const ck = coordKey(coords.lat, coords.lon);
    let netCalls = 0;
    for (const w of todo) {
      const cached =
        readCache(`${ck}:${w.date}`) ??
        (w.startTime ? readCache(`${ck}:${w.date}:${w.startTime}`) : null);
      if (!cached && netCalls >= maxCalls) continue; // budget spent for this run
      const snap = await getDayWeather(coords.lat, coords.lon, w.date, w.startTime);
      if (snap) useTrainingStore.getState().updateWorkout(w.id, { weather: snap });
      if (!cached) {
        netCalls += 1;
        await delay(400);
      }
    }
  } finally {
    backfillRunning = false;
  }
}
