// Domain models for the marathon training tracker.
// Everything is persisted in localStorage via the Zustand store.

export type WorkoutType = "easy" | "tempo" | "interval" | "long" | "recovery";

export type WeekPhase =
  | "base"
  | "build"
  | "peak"
  | "taper"
  | "race"
  | "reduced";

export interface Workout {
  id: string;
  date: string; // ISO yyyy-mm-dd — anchors the calendar + week grouping
  type: WorkoutType;
  title: string; // e.g. "6×800m @ 4:10" or "Long run"
  weekNumber: number;
  plannedDistanceKm: number;
  plannedPace?: string; // "mm:ss" per km
  actualDistanceKm?: number;
  actualPace?: string; // entered, or derived from distance + duration
  durationMin?: number;
  notes?: string;
  completed: boolean;
  isCustom?: boolean;
}

export interface TrainingWeek {
  weekNumber: number;
  startDate: string; // Monday ISO
  endDate: string; // Sunday ISO
  phase: WeekPhase;
  label?: string; // "Surf trip — recovery", "Taper", "Race week", ...
  workoutIds: string[];
}

export interface Preferences {
  theme: "light" | "dark" | "system";
  locale?: "en" | "nl";
}

/** Editable per-plan metadata (race + goal), independent of the schedule. */
export interface PlanMeta {
  name: string; // "Milo's Marathon"
  raceName: string; // "Marathon"
  raceDate: string; // "2026-10-11"
  goalPace: string; // "4:58"
  goalLabel: string; // "Sub-3:30"
}

/** A period that may hinder training (vacation, trip, etc.) — context only. */
export interface OffDay {
  id: string;
  start: string; // ISO yyyy-mm-dd
  end: string; // ISO yyyy-mm-dd (inclusive)
  title: string; // "Vacation to Ghent"
  note?: string; // "Likely no training"
}

export interface TrainingPlan extends PlanMeta {
  id: string;
  version: number; // schema version, for export / migration
  createdAt: string;
  weeks: TrainingWeek[];
  workouts: Record<string, Workout>; // keyed by id
  offDays: OffDay[];
}

export const WORKOUT_TYPES: WorkoutType[] = [
  "easy",
  "tempo",
  "interval",
  "long",
  "recovery",
];

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  easy: "Easy Run",
  tempo: "Tempo",
  interval: "Interval",
  long: "Long Run",
  recovery: "Recovery",
};

export const PHASE_LABELS: Record<WeekPhase, string> = {
  base: "Base",
  build: "Build",
  peak: "Peak",
  taper: "Taper",
  race: "Race",
  reduced: "Reduced",
};

// Tailwind color token per workout type (see globals.css @theme).
export const WORKOUT_TYPE_COLOR: Record<WorkoutType, string> = {
  easy: "easy",
  tempo: "tempo",
  interval: "interval",
  long: "long",
  recovery: "recovery",
};
