// Minimal builders for tests. Kept out of *.test.ts so several suites can
// share them; not imported by any app code.

import type { TrainingPlan, TrainingWeek, Workout } from "@/lib/types";

export function makeWorkout(patch: Partial<Workout> & { id: string }): Workout {
  return {
    date: "2026-06-22",
    type: "easy",
    title: "Easy run",
    weekNumber: 1,
    plannedDistanceKm: 8,
    completed: false,
    ...patch,
  };
}

export function makeWeek(patch: Partial<TrainingWeek> = {}): TrainingWeek {
  return {
    weekNumber: 1,
    startDate: "2026-06-22",
    endDate: "2026-06-28",
    phase: "base",
    workoutIds: [],
    ...patch,
  };
}

export function makePlan(patch: Partial<TrainingPlan> = {}): TrainingPlan {
  const workouts = patch.workouts ?? {};
  return {
    id: "p1",
    name: "Plan",
    raceName: "Marathon",
    raceDistanceKm: 42.2,
    raceDate: "2026-10-11",
    goalPace: "4:58",
    goalLabel: "Sub-3:30",
    version: 1,
    createdAt: "2026-06-01T00:00:00.000Z",
    weeks: [makeWeek({ workoutIds: Object.keys(workouts) })],
    offDays: [],
    ...patch,
    workouts,
  };
}
