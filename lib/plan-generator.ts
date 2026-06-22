import { addDays, differenceInCalendarDays, startOfWeek } from "date-fns";
import {
  fromISO,
  specialPeriodFor,
  toISO,
  overlappingSpecialPeriod,
} from "./date";
import { paceToSeconds, secondsToPace } from "./pace";
import type {
  OffDay,
  TrainingPlan,
  TrainingPrefs,
  TrainingWeek,
  WeekPhase,
  Workout,
  WorkoutType,
} from "./types";

export const RACE_DATE = "2026-10-11"; // Sunday
export const PLAN_VERSION = 1;
export const MARATHON_KM = 42.2;

// Goal: sub-3:30 → race pace ~4:58/km. Derived training paces:
const PACE = {
  recovery: "5:30",
  easy: "5:05",
  long: "5:15",
  tempo: "4:30",
  interval: "4:10",
  race: "4:58",
};

// Long-run distance (km) indexed by weeks-to-race (0 = race week).
// Builds with periodic cutbacks to a 30 km peak two weeks out, then tapers.
const LONG_RUN_BY_WTR = [
  MARATHON_KM, // 0  race week
  20, // 1  taper
  30, // 2  peak
  24, // 3
  28, // 4
  26, // 5
  20, // 6  cutback
  24, // 7
  22, // 8
  16, // 9  cutback
  20, // 10
  18, // 11
  14, // 12 cutback
  16, // 13
  14, // 14
  12, // 15
];
const BASE_LONG_RUN = 12;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function addSecondsToPace(pace: string, seconds: number): string {
  const secs = paceToSeconds(pace);
  if (secs == null) return pace;
  return secondsToPace(secs + seconds);
}

function id(date: string, type: WorkoutType): string {
  return `${date}-${type}`;
}

function phaseFor(weeksToRace: number): WeekPhase {
  if (weeksToRace === 0) return "race";
  if (weeksToRace === 1) return "taper";
  if (weeksToRace === 2) return "peak";
  if (weeksToRace <= 8) return "build";
  return "base";
}

interface Planned {
  type: WorkoutType;
  title: string;
  distanceKm: number;
  pace: string;
}

/** The four scheduled workouts for a week, before special-period adjustment. */
function plannedWorkouts(
  weeksToRace: number,
  weekIndex: number,
  longRun: number,
): { mon: Planned; wed: Planned; thu: Planned; sun: Planned } {
  // Soften easy/long paces for the first three weeks (injury return).
  const soften = weekIndex < 3 ? 10 : 0;
  const easyPace = addSecondsToPace(PACE.easy, soften);
  const longPace = addSecondsToPace(PACE.long, soften);

  // Race week: shakeouts + the marathon.
  if (weeksToRace === 0) {
    return {
      mon: { type: "easy", title: "Easy shakeout", distanceKm: 6, pace: easyPace },
      wed: {
        type: "easy",
        title: "Easy + strides",
        distanceKm: 5,
        pace: easyPace,
      },
      thu: {
        type: "recovery",
        title: "Pre-race jog",
        distanceKm: 4,
        pace: PACE.recovery,
      },
      sun: {
        type: "long",
        title: "Marathon — race day 🏁",
        distanceKm: MARATHON_KM,
        pace: PACE.race,
      },
    };
  }

  const easyKm = clamp(Math.round(longRun * 0.4), 5, 11);
  const recoveryKm = clamp(Math.round(longRun * 0.3), 4, 8);

  // Alternate the Wednesday quality session between tempo and intervals.
  const isInterval = weekIndex % 2 === 1;
  let quality: Planned;
  if (isInterval) {
    const reps = clamp(Math.round(longRun / 4), 4, 10);
    const dist = clamp(Math.round(reps * 0.8 + 4), 7, 13);
    quality = {
      type: "interval",
      title: `${reps}×800m @ ${PACE.interval}`,
      distanceKm: dist,
      pace: PACE.interval,
    };
  } else {
    const tempoKm = clamp(Math.round(longRun * 0.4), 5, 10);
    quality = {
      type: "tempo",
      title: `Tempo ${tempoKm} km @ ${PACE.tempo}`,
      distanceKm: tempoKm + 3, // incl. warm-up + cool-down
      pace: PACE.tempo,
    };
  }
  // During the taper, swap intervals/tempo for race-pace work.
  if (weeksToRace === 1) {
    quality = {
      type: "tempo",
      title: `Race-pace ${Math.min(6, easyKm)} km @ ${PACE.race}`,
      distanceKm: 9,
      pace: PACE.race,
    };
  }

  const longTitle = weeksToRace === 2 ? "Long run — peak 🏔️" : "Long run";

  return {
    mon: { type: "easy", title: "Easy run", distanceKm: easyKm, pace: easyPace },
    wed: quality,
    thu: {
      type: "recovery",
      title: "Recovery run",
      distanceKm: recoveryKm,
      pace: PACE.recovery,
    },
    sun: { type: "long", title: longTitle, distanceKm: longRun, pace: longPace },
  };
}

/**
 * Apply a special period to a planned workout based on its date.
 * Returns null when the workout should be dropped entirely (full vacation).
 */
function applySpecialPeriod(date: string, p: Planned): Planned | null {
  const period = specialPeriodFor(date);
  if (!period) return p;

  if (period.severity === "none") {
    return null; // vacation — no training
  }
  if (period.severity === "limited") {
    // Surf trip: at most a short recovery jog.
    return {
      type: "recovery",
      title: `Optional easy jog — ${period.label}`,
      distanceKm: clamp(Math.round(p.distanceKm * 0.35), 4, 8),
      pace: PACE.recovery,
    };
  }
  // reduced
  return {
    type: p.type === "long" ? "easy" : p.type,
    title: `${p.title} (reduced — ${period.label})`,
    distanceKm: clamp(Math.round(p.distanceKm * 0.6), 4, p.distanceKm),
    pace: addSecondsToPace(p.pace, 10),
  };
}

function makeWorkout(
  date: string,
  weekNumber: number,
  p: Planned,
): Workout {
  return {
    id: id(date, p.type),
    date,
    type: p.type,
    title: p.title,
    weekNumber,
    plannedDistanceKm: p.distanceKm,
    plannedPace: p.pace,
    completed: false,
  };
}

export interface GeneratePlanOptions {
  id?: string;
  name?: string;
  raceName?: string;
  raceDistanceKm?: number;
  raceDate?: string;
  startDate?: string;
  goalPace?: string;
  goalLabel?: string;
  /** Completed runs to seed as history (primary plan only). */
  seedRuns?: CompletedRunSeed[];
  /** Off-periods to attach to the plan. */
  offDays?: OffDay[];
  trainingPrefs?: TrainingPrefs;
  /**
   * Anchor the plan's first week to this date instead of today. When set,
   * already-elapsed weeks/days are still generated (the skip-past rule is
   * disabled), so a regenerate reproduces the plan from its original start.
   */
  planStart?: string;
  /** Preserve a fixed creation timestamp across regenerates. */
  createdAt?: string;
}

export const DEFAULT_PLAN_META = {
  name: "Milo's Marathon",
  raceName: "Marathon",
  raceDistanceKm: MARATHON_KM,
  raceDate: RACE_DATE,
  goalPace: "4:58",
  goalLabel: "Sub-3:30",
};

/** Stable id for the primary (seeded) plan, so regeneration keeps the history. */
export const DEFAULT_PLAN_ID = "milo-marathon";

export const DEFAULT_TRAINING_PREFS: TrainingPrefs = {
  daysPerWeek: 4,
  flexibleDays: false,
  trainingDays: [true, false, true, true, false, false, true], // Mon/Wed/Thu/Sun
  planningMode: "exact",
  targetDistanceKm: 30,
};

export interface CompletedRunSeed {
  date: string; // ISO yyyy-mm-dd
  type: WorkoutType;
  title: string;
  distanceKm: number;
  pace: string; // "mm:ss" per km
  durationMin: number;
}

/**
 * Default off-periods for the primary plan (vacations/trips that hinder
 * training). Shown in the app and exported as context. Editable by the user.
 */
export const DEFAULT_OFF_DAYS: OffDay[] = [
  {
    id: "off-ghent",
    start: "2026-07-03",
    end: "2026-07-05",
    title: "Vacation to Ghent",
    note: "Likely no training",
  },
  {
    id: "off-surf-spain",
    start: "2026-07-24",
    end: "2026-08-02",
    title: "Surf trip to Spain",
    note: "Very limited running",
  },
  {
    id: "off-gran-canaria",
    start: "2026-09-16",
    end: "2026-09-23",
    title: "Vacation to Gran Canaria",
    note: "Reduced training possible",
  },
];

/**
 * Real completed runs to seed into the primary plan as training history.
 * Edit this list to change the logged history.
 */
export const MILO_SEED_RUNS: CompletedRunSeed[] = [
  // 12.16 km @ 4:49/km, 58:33
  { date: "2026-06-09", type: "long", title: "Long run", distanceKm: 12.16, pace: "4:49", durationMin: 58.55 },
  // 10.04 km @ 5:16/km (warm), 52:52
  { date: "2026-06-18", type: "easy", title: "Easy run", distanceKm: 10.04, pace: "5:16", durationMin: 52.87 },
  // 5.66 km @ 4:53/km, 27:39 — post-triathlon recovery jog
  { date: "2026-06-21", type: "recovery", title: "Recovery run", distanceKm: 5.66, pace: "4:53", durationMin: 27.65 },
];

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `plan-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}

/** Build the full default training plan from today's week through race week. */
export function generateDefaultPlan(
  opts: GeneratePlanOptions = {},
): TrainingPlan {
  const raceDate = opts.raceDate ?? DEFAULT_PLAN_META.raceDate;
  const today = new Date();
  const todayStr = toISO(today);
  // Anchor to the plan's original start when regenerating; otherwise to today.
  const anchor = opts.planStart ? new Date(opts.planStart) : today;
  const keepPast = opts.planStart != null;
  const firstMonday = startOfWeek(anchor, { weekStartsOn: 1 });
  const raceWeekMonday = startOfWeek(fromISO(raceDate), { weekStartsOn: 1 });

  const totalWeeks =
    Math.round(
      differenceInCalendarDays(raceWeekMonday, firstMonday) / 7,
    ) + 1;

  const weeks: TrainingWeek[] = [];
  const workouts: Record<string, Workout> = {};

  for (let w = 0; w < totalWeeks; w++) {
    const weekNumber = w + 1;
    const monday = addDays(firstMonday, w * 7);
    const sunday = addDays(monday, 6);
    const weeksToRace = totalWeeks - 1 - w;

    const longRun = LONG_RUN_BY_WTR[weeksToRace] ?? BASE_LONG_RUN;
    const planned = plannedWorkouts(weeksToRace, w, longRun);

    const dayMap: { offset: number; planned: Planned }[] = [
      { offset: 0, planned: planned.mon }, // Monday
      { offset: 2, planned: planned.wed }, // Wednesday
      { offset: 3, planned: planned.thu }, // Thursday
      { offset: 6, planned: planned.sun }, // Sunday
    ];

    const workoutIds: string[] = [];
    let longAffected = false;

    for (const { offset, planned: base } of dayMap) {
      const date = toISO(addDays(monday, offset));
      // Don't emit planned sessions that are already in the past — unless we're
      // anchored to the plan start and reproducing elapsed weeks.
      if (!keepPast && date < todayStr) continue;
      const adjusted = applySpecialPeriod(date, base);
      if (!adjusted) {
        if (base.type === "long") longAffected = true;
        continue; // dropped (vacation)
      }
      if (base.type === "long" && adjusted.title !== base.title) {
        longAffected = true;
      }
      const workout = makeWorkout(date, weekNumber, adjusted);
      workouts[workout.id] = workout;
      workoutIds.push(workout.id);
    }

    const period = overlappingSpecialPeriod(toISO(monday), toISO(sunday));
    let phase = phaseFor(weeksToRace);
    if (period && longAffected) phase = "reduced";

    weeks.push({
      weekNumber,
      startDate: toISO(monday),
      endDate: toISO(sunday),
      phase,
      label: period ? period.label : undefined,
      workoutIds,
    });
  }

  // Seed completed runs (training history). Added regardless of the skip-past
  // rule above, since these actually happened.
  for (const run of opts.seedRuns ?? []) {
    const wid = `${run.date}-${run.type}-seed`;
    const idx = weeks.findIndex(
      (wk) => run.date >= wk.startDate && run.date <= wk.endDate,
    );
    workouts[wid] = {
      id: wid,
      date: run.date,
      type: run.type,
      title: run.title,
      weekNumber: idx >= 0 ? weeks[idx].weekNumber : 0,
      plannedDistanceKm: run.distanceKm,
      plannedPace: run.pace,
      actualDistanceKm: run.distanceKm,
      actualPace: run.pace,
      durationMin: run.durationMin,
      completed: true,
      isCustom: true,
    };
    if (idx >= 0) weeks[idx].workoutIds.push(wid);
  }

  // Keep each week's workouts in chronological order.
  for (const wk of weeks) {
    wk.workoutIds.sort((a, b) =>
      workouts[a].date < workouts[b].date
        ? -1
        : workouts[a].date > workouts[b].date
          ? 1
          : 0,
    );
  }

  return {
    id: opts.id ?? newId(),
    name: opts.name ?? DEFAULT_PLAN_META.name,
    raceName: opts.raceName ?? DEFAULT_PLAN_META.raceName,
    raceDistanceKm: opts.raceDistanceKm ?? DEFAULT_PLAN_META.raceDistanceKm,
    raceDate,
    startDate: opts.startDate ?? toISO(firstMonday),
    goalPace: opts.goalPace ?? DEFAULT_PLAN_META.goalPace,
    goalLabel: opts.goalLabel ?? DEFAULT_PLAN_META.goalLabel,
    version: PLAN_VERSION,
    createdAt: opts.createdAt ?? new Date().toISOString(),
    weeks,
    workouts,
    offDays: opts.offDays ?? [],
    trainingPrefs: opts.trainingPrefs ?? DEFAULT_TRAINING_PREFS,
  };
}
