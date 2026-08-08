// The bundled demo plan a new user sees when they choose "just look around".
//
// It's a real exported training block (see scripts/scrub-example-plan.mjs for
// how lib/example-plan.json is produced), rebased onto the current week so the
// demo never rots into a race that finished months ago.

import { addDays, differenceInCalendarDays, startOfWeek } from "date-fns";
import { fromISO, toISO } from "@/lib/date";
import { DEFAULT_PLAN_ID } from "@/lib/plan/defaults";
import { normalizeBundle } from "@/lib/plan/storage";
import type { TrainingPlan, Workout } from "@/lib/types";

const DAY_MS = 86_400_000;

const shiftISO = (iso: string, days: number) => toISO(addDays(fromISO(iso), days));

const shiftTimestamp = (ts: string, days: number) =>
  new Date(new Date(ts).getTime() + days * DAY_MS).toISOString();

/**
 * Whole weeks between the export's week and the seeding week. A multiple of 7,
 * so every session keeps its weekday and the race stays on a Sunday; "today"
 * lands on the same week of the plan it occupied when the bundle was exported.
 * Zero when seeded in the export's own week, which makes the shift easy to
 * eyeball in a diff.
 */
function weekShiftDays(exportedAt: string | undefined, now: Date): number {
  if (!exportedAt) return 0;
  const from = startOfWeek(new Date(exportedAt), { weekStartsOn: 1 });
  const to = startOfWeek(now, { weekStartsOn: 1 });
  const days = differenceInCalendarDays(to, from);
  return Number.isFinite(days) ? days : 0;
}

/**
 * Rebuild a snapshot on the shifted date, naming every field it keeps.
 * `lat`/`lon` are dropped by omission — defence in depth, since the committed
 * JSON is already scrubbed but a regeneration could skip the script.
 */
function shiftWeather(
  w: NonNullable<Workout["weather"]>,
  days: number,
): NonNullable<Workout["weather"]> {
  return {
    tempC: w.tempC,
    conditionId: w.conditionId,
    condition: w.condition,
    icon: w.icon,
    source: w.source,
    observedAt: shiftTimestamp(w.observedAt, days),
  };
}

function shiftWorkout(w: Workout, days: number): Workout {
  return {
    ...w,
    date: shiftISO(w.date, days),
    ...(w.windowStart ? { windowStart: shiftISO(w.windowStart, days) } : {}),
    ...(w.windowEnd ? { windowEnd: shiftISO(w.windowEnd, days) } : {}),
    ...(w.weather ? { weather: shiftWeather(w.weather, days) } : {}),
  };
}

/**
 * Move every date in a plan by `days`. Workout ids deliberately keep their
 * original dates in the string: `mergeLoggedWorkouts` and `findMatchingPlanId`
 * both key off id stability, and the source data already has a few sessions
 * whose id and date disagree because they were moved by hand.
 */
function shiftPlan(plan: TrainingPlan, days: number): TrainingPlan {
  // Runs even when `days` is 0: the rebuild is also what drops coordinates.
  const workouts: Record<string, Workout> = {};
  for (const [id, w] of Object.entries(plan.workouts)) {
    workouts[id] = shiftWorkout(w, days);
  }

  return {
    ...plan,
    raceDate: shiftISO(plan.raceDate, days),
    startDate: plan.startDate ? shiftISO(plan.startDate, days) : plan.startDate,
    createdAt: shiftTimestamp(plan.createdAt, days),
    weeks: plan.weeks.map((wk) => ({
      ...wk,
      startDate: shiftISO(wk.startDate, days),
      endDate: shiftISO(wk.endDate, days),
    })),
    workouts,
    offDays: (plan.offDays ?? []).map((o) => ({
      ...o,
      start: shiftISO(o.start, days),
      end: shiftISO(o.end, days),
    })),
  };
}

/**
 * The bundled demo plan, rebased onto the current week and tagged as an
 * example. `now` is injectable so the shift can be exercised deterministically.
 *
 * The JSON is loaded dynamically: it's ~26 KB that only a brand-new install
 * ever needs, and a static import would put it in the chunk every route pays
 * for.
 */
export async function loadExamplePlan(now: Date = new Date()): Promise<TrainingPlan> {
  const bundle = (await import("@/lib/plan/example-plan.json")).default;

  // Only the plan. The export's `preferences` would mark onboarding as seen
  // and switch on weather + the split scanner for someone who never asked.
  const { plans, activePlanId } = normalizeBundle(bundle);
  const raw = plans[activePlanId ?? ""] ?? Object.values(plans)[0];

  const shifted = shiftPlan(
    raw,
    weekShiftDays((bundle as { exportedAt?: string }).exportedAt, now),
  );

  // `isExample` is applied here rather than baked into the JSON: it describes
  // the plan's role in this installation, not the data. The identical bytes
  // imported by a user via Settings are *their* plan and must stay eligible as
  // AI context, which `lib/plan-context.ts` decides from this flag.
  return { ...shifted, id: DEFAULT_PLAN_ID, isExample: true };
}
