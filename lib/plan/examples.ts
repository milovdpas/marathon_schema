// The catalogue of demo plans, one per kind of athlete.
//
// A new user who picks "just look around" gets the demo that matches what they
// said they train for, and can add the others later from Settings.
//
// All seven race types now have one. The triathlon demo models race day as
// three workouts on the same date rather than one workout with legs: every
// consumer already understands a workout, and none of them would know how to
// sum legs. Formally linking them, plus transitions, is slice 4.

import { DEFAULT_PLAN_ID } from "@/lib/plan/defaults";
import type { AthleteType, TrainingPlan } from "@/lib/types";

export type ExamplePlanKey =
  | "marathon"
  | "trail"
  | "ultra"
  | "backyard"
  | "cycling"
  | "swimming"
  | "triathlon";

export interface ExamplePlanEntry {
  key: ExamplePlanKey;
  /** Fixed, so adding the same demo twice replaces rather than duplicates it. */
  id: string;
  /** i18n key for the picker label. The plan's own `name` is data, not UI. */
  labelKey: string;
  descriptionKey: string;
  /** Who this demo is offered to. */
  athleteTypes: AthleteType[];
  load: () => Promise<TrainingPlan>;
}

/**
 * Each entry holds its own `import()`. A single dynamic import built from a
 * template literal would make the bundler emit one chunk containing every
 * demo — the marathon JSON alone is ~26 KB, and a user only ever opens one.
 */
export const EXAMPLE_PLANS: readonly ExamplePlanEntry[] = [
  {
    key: "marathon",
    // The original seeded plan. Existing installs already hold it under this
    // id, so it must not move — see docs/racepilot.md, "Frozen identifiers".
    id: DEFAULT_PLAN_ID,
    labelKey: "examples.marathon",
    descriptionKey: "examples.marathonDesc",
    athleteTypes: ["runner"],
    load: () =>
      import("@/lib/plan/example-plan").then((m) => m.loadExamplePlan()),
  },
  {
    key: "trail",
    id: "example-trail",
    labelKey: "examples.trail",
    descriptionKey: "examples.trailDesc",
    athleteTypes: ["trail"],
    load: () =>
      import("@/lib/plan/example-specs").then((m) =>
        m.buildGeneratedExample("trail"),
      ),
  },
  {
    key: "ultra",
    id: "example-ultra",
    labelKey: "examples.ultra",
    descriptionKey: "examples.ultraDesc",
    athleteTypes: ["ultra"],
    load: () =>
      import("@/lib/plan/example-specs").then((m) =>
        m.buildGeneratedExample("ultra"),
      ),
  },
  {
    key: "cycling",
    id: "example-cycling",
    labelKey: "examples.cycling",
    descriptionKey: "examples.cyclingDesc",
    athleteTypes: ["cyclist"],
    load: () =>
      import("@/lib/plan/example-specs").then((m) =>
        m.buildGeneratedExample("cycling"),
      ),
  },
  {
    key: "swimming",
    id: "example-swimming",
    labelKey: "examples.swimming",
    descriptionKey: "examples.swimmingDesc",
    athleteTypes: ["swimmer"],
    load: () =>
      import("@/lib/plan/example-specs").then((m) =>
        m.buildGeneratedExample("swimming"),
      ),
  },
  {
    key: "triathlon",
    id: "example-triathlon",
    labelKey: "examples.triathlon",
    descriptionKey: "examples.triathlonDesc",
    athleteTypes: ["triathlete"],
    load: () =>
      import("@/lib/plan/example-specs").then((m) =>
        m.buildGeneratedExample("triathlon"),
      ),
  },
  {
    key: "backyard",
    id: "example-backyard",
    labelKey: "examples.backyard",
    descriptionKey: "examples.backyardDesc",
    athleteTypes: ["ultra"],
    load: () =>
      import("@/lib/plan/example-specs").then((m) =>
        m.buildGeneratedExample("backyard"),
      ),
  },
];

export function exampleByKey(key: ExamplePlanKey): ExamplePlanEntry {
  const entry = EXAMPLE_PLANS.find((e) => e.key === key);
  if (!entry) throw new Error(`Unknown example plan: ${key}`);
  return entry;
}

/** Whether a plan id belongs to the catalogue, for the "already added" check. */
export function isExamplePlanId(id: string): boolean {
  return EXAMPLE_PLANS.some((e) => e.id === id);
}

/**
 * The demos worth offering this athlete: the entries that name one of their
 * types.
 *
 * An unknown or empty profile is treated as **a runner**, not as "show
 * everything". That is a deliberate departure from `capabilitiesFor`, and the
 * two are answering different questions: hiding a *feature* from someone who
 * told us nothing would make the app look broken, whereas offering a swimmer's
 * plan to someone who has never swum is just clutter. Running is also what an
 * unset profile means everywhere else — `DEFAULT_SPORT`, an absent plan sport.
 *
 * "Show all sports" in Settings is the escape hatch, so nothing is unreachable.
 *
 * Callers must still handle `[]`: an athlete type added before its demo will
 * land here with nothing to offer.
 */
export function examplesFor(types?: readonly AthleteType[]): ExamplePlanEntry[] {
  const effective: readonly AthleteType[] = types?.length ? types : ["runner"];
  return EXAMPLE_PLANS.filter((e) =>
    e.athleteTypes.some((t) => effective.includes(t)),
  );
}

/**
 * The athlete's own types that no demo covers yet — empty today, and kept
 * because the next athlete type added will land here before its demo does. A
 * picker that silently gains nothing when you add a sport reads as broken
 * rather than as not-built-yet.
 */
export function athleteTypesWithoutExample(
  types?: readonly AthleteType[],
): AthleteType[] {
  if (!types?.length) return [];
  return types.filter(
    (t) => !EXAMPLE_PLANS.some((e) => e.athleteTypes.includes(t)),
  );
}

/**
 * The single demo to seed on "just look around" — the one matching the type the
 * user identifies with most, not merely the first they're eligible for (a trail
 * runner shouldn't be handed the marathon block).
 *
 * Every athlete type has a demo now, so the marathon fallback only catches a
 * profile we don't recognise at all.
 */
export function defaultExampleFor(
  types?: readonly AthleteType[],
): ExamplePlanEntry {
  const primary = types?.[0];
  const match = primary
    ? EXAMPLE_PLANS.find((e) => e.athleteTypes.includes(primary))
    : undefined;
  return match ?? exampleByKey("marathon");
}
