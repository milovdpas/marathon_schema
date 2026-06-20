import { addDays, differenceInCalendarDays, startOfWeek } from "date-fns";
import {
  fromISO,
  specialPeriodFor,
  toISO,
  overlappingSpecialPeriod,
} from "./date";
import { paceToSeconds, secondsToPace } from "./pace";
import type {
  TrainingPlan,
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

/** Build the full default training plan from today's week through race week. */
export function generateDefaultPlan(raceDate: string = RACE_DATE): TrainingPlan {
  const today = new Date();
  const firstMonday = startOfWeek(today, { weekStartsOn: 1 });
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

  return {
    version: PLAN_VERSION,
    createdAt: new Date().toISOString(),
    raceDate,
    weeks,
    workouts,
  };
}
