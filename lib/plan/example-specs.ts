// Specs for the generated demo plans. Loaded lazily by `examples.ts` — only a
// user who actually opens one of these ever downloads the builder.

import { BACKYARD_LOOP_KM, backyardDistanceKm } from "@/lib/plan/backyard";
import { buildExamplePlan, type ExampleSpec } from "@/lib/plan/example-builder";
import type { TrainingPlan } from "@/lib/types";

const BACKYARD_YARDS = 20;

const TRAIL: ExampleSpec = {
  id: "example-trail",
  name: "Trail 50K — example",
  raceName: "Trail 50K",
  raceDistanceKm: 50,
  goalPace: "6:30",
  goalLabel: "Sub-5:30",
  weeks: 12,
  pastWeeks: 5,
  raceSession: { type: "long", title: "Trail 50K", km: 50, pace: "6:30" },
  sessions: [
    { day: 1, type: "easy", title: "Easy trails", km: 8, pace: "5:40" },
    { day: 3, type: "tempo", title: "Tempo on rolling terrain", km: 10, pace: "4:55" },
    { day: 5, type: "easy", title: "Hill repeats", km: 12, pace: "6:00" },
    { day: 6, type: "long", title: "Long trail run", km: 22, pace: "6:10" },
  ],
  trainingPrefs: {
    daysPerWeek: 4,
    flexibleDays: false,
    trainingDays: [false, true, false, true, false, true, true],
    planningMode: "exact",
    targetDistanceKm: 55,
  },
};

const ULTRA: ExampleSpec = {
  id: "example-ultra",
  name: "100 km ultra — example",
  raceName: "100 km ultra",
  raceDistanceKm: 100,
  goalPace: "6:45",
  goalLabel: "Sub-12:00",
  weeks: 16,
  pastWeeks: 6,
  raceSession: { type: "long", title: "100 km ultra", km: 100, pace: "6:45" },
  sessions: [
    { day: 0, type: "recovery", title: "Recovery jog", km: 6, pace: "6:10" },
    { day: 2, type: "interval", title: "5×1 km at threshold", km: 10, pace: "4:45" },
    { day: 3, type: "easy", title: "Easy run", km: 10, pace: "5:35" },
    // Back-to-back long days are the point of ultra training: the Sunday run
    // starts on Saturday's legs.
    { day: 5, type: "long", title: "Long run (day 1)", km: 20, pace: "5:55" },
    { day: 6, type: "long", title: "Long run (day 2)", km: 26, pace: "6:05" },
  ],
  trainingPrefs: {
    daysPerWeek: 5,
    flexibleDays: false,
    trainingDays: [true, false, true, true, false, true, true],
    planningMode: "exact",
    targetDistanceKm: 90,
  },
};

const BACKYARD: ExampleSpec = {
  id: "example-backyard",
  name: "Backyard ultra — example",
  raceName: "Backyard ultra",
  raceDistanceKm: backyardDistanceKm(BACKYARD_LOOP_KM, BACKYARD_YARDS),
  goalPace: "7:00",
  goalLabel: `${BACKYARD_YARDS} yards`,
  raceType: "backyard",
  loopKm: BACKYARD_LOOP_KM,
  targetYards: BACKYARD_YARDS,
  weeks: 14,
  pastWeeks: 5,
  raceSession: {
    type: "long",
    title: `Backyard ultra — ${BACKYARD_YARDS} yards`,
    km: backyardDistanceKm(BACKYARD_LOOP_KM, BACKYARD_YARDS),
    pace: "7:00",
  },
  sessions: [
    { day: 1, type: "easy", title: "Easy run", km: 8, pace: "5:50" },
    { day: 3, type: "tempo", title: "Tempo run", km: 10, pace: "5:05" },
    // Practising the actual format: the same loop, on the hour, over and over.
    { day: 5, type: "long", title: "Loop practice (3 yards)", km: 20, pace: "6:00" },
    { day: 6, type: "easy", title: "Easy run on tired legs", km: 12, pace: "6:10" },
  ],
  trainingPrefs: {
    daysPerWeek: 4,
    flexibleDays: false,
    trainingDays: [false, true, false, true, false, true, true],
    planningMode: "exact",
    targetDistanceKm: 60,
  },
};

const SPECS = { trail: TRAIL, ultra: ULTRA, backyard: BACKYARD };

export type GeneratedExampleKey = keyof typeof SPECS;

export function buildGeneratedExample(
  key: GeneratedExampleKey,
  now?: Date,
): TrainingPlan {
  return buildExamplePlan(SPECS[key], now);
}
