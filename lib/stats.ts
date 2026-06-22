import { isWithinInterval, parseISO, startOfWeek } from "date-fns";
import { toISO } from "./date";
import { averagePace } from "./pace";
import type { TrainingPlan, Workout } from "./types";

/** All workouts as a flat array, sorted by date. */
export function allWorkouts(plan: TrainingPlan): Workout[] {
  return Object.values(plan.workouts).sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  );
}

/** Distance actually run for a workout (0 if not done). */
export function distanceRun(w: Workout): number {
  if (w.actualDistanceKm != null) return w.actualDistanceKm;
  return w.completed ? w.plannedDistanceKm : 0;
}

/** The pace to display/aggregate for a workout. */
export function effectivePace(w: Workout): string | undefined {
  return w.actualPace ?? (w.completed ? w.plannedPace : undefined);
}

export interface OverallStats {
  totalKm: number;
  longestRunKm: number;
  averagePace: string; // "mm:ss" or "—"
  completedCount: number;
  totalCount: number;
  completionPct: number; // 0–100
  plannedTotalKm: number;
}

export function overallStats(plan: TrainingPlan): OverallStats {
  const workouts = allWorkouts(plan);
  let totalKm = 0;
  let longestRunKm = 0;
  let completedCount = 0;
  let plannedTotalKm = 0;
  const paceRuns: { distanceKm: number; pace?: string }[] = [];

  for (const w of workouts) {
    plannedTotalKm += w.plannedDistanceKm;
    if (w.completed) completedCount += 1;
    const ran = distanceRun(w);
    if (ran > 0) {
      totalKm += ran;
      longestRunKm = Math.max(longestRunKm, ran);
      paceRuns.push({ distanceKm: ran, pace: effectivePace(w) });
    }
  }

  return {
    totalKm: round1(totalKm),
    longestRunKm: round1(longestRunKm),
    averagePace: averagePace(paceRuns),
    completedCount,
    totalCount: workouts.length,
    completionPct:
      workouts.length === 0
        ? 0
        : Math.round((completedCount / workouts.length) * 100),
    plannedTotalKm: round1(plannedTotalKm),
  };
}

export interface RangeMileage {
  plannedKm: number;
  actualKm: number;
  completed: number;
  total: number;
}

/** Planned vs actual mileage for workouts within [startISO, endISO] inclusive. */
export function mileageInRange(
  plan: TrainingPlan,
  startISO: string,
  endISO: string,
): RangeMileage {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  let plannedKm = 0;
  let actualKm = 0;
  let completed = 0;
  let total = 0;
  for (const w of allWorkouts(plan)) {
    if (!isWithinInterval(parseISO(w.date), { start, end })) continue;
    total += 1;
    plannedKm += w.plannedDistanceKm;
    actualKm += distanceRun(w);
    if (w.completed) completed += 1;
  }
  return {
    plannedKm: round1(plannedKm),
    actualKm: round1(actualKm),
    completed,
    total,
  };
}

export interface WeeklyMileage {
  weekNumber: number;
  label: string;
  plannedKm: number;
  actualKm: number;
}

/** Per-week planned vs actual mileage (for the trend chart). */
export function weeklyMileage(plan: TrainingPlan): WeeklyMileage[] {
  return plan.weeks.map((week) => {
    let plannedKm = 0;
    let actualKm = 0;
    for (const wid of week.workoutIds) {
      const w = plan.workouts[wid];
      if (!w) continue;
      plannedKm += w.plannedDistanceKm;
      actualKm += distanceRun(w);
    }
    return {
      weekNumber: week.weekNumber,
      label: `W${week.weekNumber}`,
      plannedKm: round1(plannedKm),
      actualKm: round1(actualKm),
    };
  });
}

export interface LongRunPoint {
  weekNumber: number;
  label: string;
  planned: number;
  actual: number | null;
}

/** Long-run progression, planned vs actual (for the progress chart). */
export function longRunProgression(plan: TrainingPlan): LongRunPoint[] {
  return plan.weeks.map((week) => {
    let planned = 0;
    let actual = 0;
    let hasActual = false;
    for (const wid of week.workoutIds) {
      const w = plan.workouts[wid];
      if (!w || w.type !== "long") continue;
      planned = Math.max(planned, w.plannedDistanceKm);
      const ran = distanceRun(w);
      if (ran > 0) {
        actual = Math.max(actual, ran);
        hasActual = true;
      }
    }
    return {
      weekNumber: week.weekNumber,
      label: `W${week.weekNumber}`,
      planned: round1(planned),
      actual: hasActual ? round1(actual) : null,
    };
  });
}

export interface WeekHistoryPoint {
  weekStart: string; // Monday ISO
  plannedKm: number;
  actualKm: number;
}

/**
 * Planned vs actual distance bucketed by calendar week (Mon-start), across
 * whatever workouts are passed in — use this with ALL plans' workouts to see
 * training volume over time, including runs outside the current plan.
 */
export function weeklyHistory(workouts: Workout[]): WeekHistoryPoint[] {
  const planned = new Map<string, number>();
  const actual = new Map<string, number>();
  for (const w of workouts) {
    const weekStart = toISO(startOfWeek(parseISO(w.date), { weekStartsOn: 1 }));
    planned.set(weekStart, (planned.get(weekStart) ?? 0) + (w.plannedDistanceKm || 0));
    const ran = distanceRun(w);
    if (ran > 0) actual.set(weekStart, (actual.get(weekStart) ?? 0) + ran);
  }
  return [...new Set([...planned.keys(), ...actual.keys()])]
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .map((weekStart) => ({
      weekStart,
      plannedKm: round1(planned.get(weekStart) ?? 0),
      actualKm: round1(actual.get(weekStart) ?? 0),
    }));
}

/** Next `count` upcoming (not-completed) workouts on/after fromISO. */
export function upcomingWorkouts(
  plan: TrainingPlan,
  fromISO: string,
  count = 3,
): Workout[] {
  return allWorkouts(plan)
    .filter((w) => !w.completed && w.date >= fromISO)
    .slice(0, count);
}

/** Most recent `count` completed workouts (newest first). */
export function recentCompleted(plan: TrainingPlan, count = 4): Workout[] {
  return allWorkouts(plan)
    .filter((w) => w.completed)
    .reverse()
    .slice(0, count);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
