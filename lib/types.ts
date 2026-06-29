// Domain models for the marathon training tracker.
// Everything is persisted in localStorage via the Zustand store.

export type WorkoutType = "easy" | "tempo" | "interval" | "long" | "recovery";

/** A weather observation captured for a workout (from OpenWeatherMap One Call 4.0). */
export interface WeatherSnapshot {
  tempC: number | null; // °C, 1 decimal (null if the source omitted it)
  conditionId: number; // OWM weather[0].id (0 if unknown)
  condition: string; // OWM weather[0].main, e.g. "Rain"
  icon: string; // OWM weather[0].icon, e.g. "10d" ("" if unknown)
  source: "forecast" | "historical"; // which timeline it came from
  observedAt: string; // ISO UTC of the observation
  lat: number;
  lon: number;
}

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
  /** Local time of day the run was finished, "HH:mm" (optional). */
  finishTime?: string;
  /** Weather captured for this workout (when the weather feature is on). */
  weather?: WeatherSnapshot;
  completed: boolean;
  isCustom?: boolean;
  /** When true, the workout may be done any day within [windowStart, windowEnd]. */
  flexible?: boolean;
  windowStart?: string; // ISO yyyy-mm-dd
  windowEnd?: string; // ISO yyyy-mm-dd
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
  /** Whether the first-run onboarding has been shown. */
  onboardingSeen?: boolean;
  /** Weather feature opted in (needs geolocation + a configured server key). */
  weatherEnabled?: boolean;
  /** Show per-day weather in the calendar. */
  weatherCalendar?: boolean;
  /** Whether the onboarding weather prompt has been shown. */
  weatherOnboardingSeen?: boolean;
}

/** Editable per-plan metadata (race + goal), independent of the schedule. */
export interface PlanMeta {
  name: string; // "Milo's Marathon"
  raceName: string; // "Marathon"
  raceDistanceKm: number; // 42.2
  raceDate: string; // "2026-10-11"
  startDate?: string; // "2026-06-22" — when the plan begins
  goalPace: string; // "4:58"
  goalLabel: string; // "Sub-3:30"
}

/** How the user wants to train — collected in the wizard, editable in settings. */
export interface TrainingPrefs {
  daysPerWeek: number;
  flexibleDays: boolean;
  trainingDays: boolean[]; // length 7, Monday→Sunday
  planningMode: "exact" | "flexible";
  targetDistanceKm: number | null; // null = let the AI decide
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
  trainingPrefs?: TrainingPrefs;
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
