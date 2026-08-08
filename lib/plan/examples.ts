// The catalogue of demo plans, one per kind of athlete.
//
// A new user who picks "just look around" gets the demo that matches what they
// said they train for, and can add the others later from Settings.
//
// Cycling, swimming and triathlon demos are deliberately absent: an example
// plan is data in the current schema, and `Workout` has no `sport` field yet,
// so they are unrepresentable rather than unwritten. Faking them by relabelling
// running workouts would make the demo lie about the one thing it exists to
// show. See docs/racepilot.md.

import { DEFAULT_PLAN_ID } from "@/lib/plan/defaults";
import type { AthleteType, TrainingPlan } from "@/lib/types";

export type ExamplePlanKey = "marathon" | "trail" | "ultra" | "backyard";

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
 * types. An unknown or empty profile gets all of them rather than none, the
 * same rule `capabilitiesFor` follows.
 *
 * Can legitimately return `[]` — a cyclist has no demo yet. Callers must handle
 * that rather than reading it as "no profile".
 */
export function examplesFor(types?: readonly AthleteType[]): ExamplePlanEntry[] {
  if (!types?.length) return [...EXAMPLE_PLANS];
  return EXAMPLE_PLANS.filter((e) =>
    e.athleteTypes.some((t) => types.includes(t)),
  );
}

/**
 * The athlete's own types that no demo covers yet — bike and swim, until
 * `Workout.sport` exists. Worth surfacing: a picker that silently gains nothing
 * when you add "cyclist" reads as broken rather than as not-built-yet.
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
 * Triathletes, cyclists and swimmers fall through to the marathon plan until
 * slice 3 gives their sports a demo. That's the least bad option: the
 * alternative is an app with nothing in it on first run.
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
