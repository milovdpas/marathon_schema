// The wire format the add-plan wizard hands to an AI.
//
// Pure data transformation, kept out of the wizard components: it's a
// versioned contract, so it's the part most likely to need a test when the
// schema bumps.

import { paceFromDistanceDuration, parseDurationToMinutes } from "./pace";
import { buildPlanContext } from "./plan-context";
import { backyardDistanceKm } from "./backyard";
import type { OffDay, RaceType, TrainingPlan, TrainingPrefs } from "./types";

export interface LatestRun {
  distanceKm: string;
  time: string; // total time, e.g. "50:43" or "1:05:30"
  date: string;
}

/** Everything the wizard collects across its four steps. */
export interface Draft {
  name: string;
  raceName: string;
  raceDistanceKm: number;
  raceDate: string;
  startDate: string;
  raceType: RaceType;
  /** Backyard only. */
  loopKm: number;
  targetYards: number;
  goalType: "finish" | "time" | "pace";
  goalValue: string;
  offDays: OffDay[];
  latestRuns: LatestRun[];
  /** Previous plans attached as read-only context for the AI. */
  contextPlanIds: string[];
  prefs: TrainingPrefs;
}

/** Sent as names rather than indexes so the prompt reads naturally. */
const WEEKDAY_KEYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function buildPlanRequest(
  draft: Draft,
  plans: Record<string, TrainingPlan>,
) {
  const isBackyard = draft.raceType === "backyard";

  return {
    app: "marathon-tracker-plan-request",
    // v2 added `previousPlans`.
    version: 2,
    race: {
      name: draft.name.trim(),
      raceName: draft.raceName.trim(),
      type: draft.raceType,
      // For a backyard the distance is derived, so downstream code that only
      // knows about "race distance" still gets a sensible number.
      distanceKm: isBackyard
        ? backyardDistanceKm(draft.loopKm, draft.targetYards)
        : draft.raceDistanceKm,
      date: draft.raceDate,
      ...(isBackyard
        ? { loopKm: draft.loopKm, targetYards: draft.targetYards }
        : {}),
    },
    startDate: draft.startDate,
    goal: isBackyard
      ? { type: "yards" as const, value: String(draft.targetYards) }
      : {
          type: draft.goalType,
          value:
            draft.goalType === "finish" ? null : draft.goalValue.trim() || null,
        },
    offDays: draft.offDays,
    latestRuns: draft.latestRuns
      .filter((r) => r.distanceKm)
      .map((r) => {
        const distanceKm = Number(r.distanceKm) || 0;
        const durationMin = parseDurationToMinutes(r.time) ?? null;
        return {
          distanceKm,
          durationMin, // total time in minutes
          pace:
            paceFromDistanceDuration(distanceKm, durationMin ?? undefined) ??
            null,
          date: r.date,
        };
      }),
    training: {
      daysPerWeek: draft.prefs.daysPerWeek,
      flexibleDays: draft.prefs.flexibleDays,
      trainingDays: draft.prefs.flexibleDays
        ? null
        : WEEKDAY_KEYS.filter((_, i) => draft.prefs.trainingDays[i]),
      planningMode: draft.prefs.planningMode,
      targetDistanceKm: draft.prefs.targetDistanceKm,
    },
    // Past training as read-only context. `filter(Boolean)` covers a plan
    // deleted while the wizard was open.
    previousPlans: draft.contextPlanIds
      .map((id) => plans[id])
      .filter(Boolean)
      .map(buildPlanContext),
  };
}
