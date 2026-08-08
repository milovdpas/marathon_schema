import { describe, expect, it } from "vitest";
import { DEFAULT_PLAN_ID } from "@/lib/plan/defaults";
import { buildGeneratedExample } from "@/lib/plan/example-specs";
import {
  athleteTypesWithoutExample,
  EXAMPLE_PLANS,
  defaultExampleFor,
  exampleByKey,
  examplesFor,
} from "@/lib/plan/examples";

const NOW = new Date("2026-08-08T10:00:00Z");

describe("the example catalogue", () => {
  it("keeps the marathon demo on its original id", () => {
    // Existing installs already hold a plan with this id. Moving it would seed
    // a duplicate for every user who has ever opened the app.
    expect(exampleByKey("marathon").id).toBe(DEFAULT_PLAN_ID);
  });

  it("gives every entry a distinct id", () => {
    const ids = EXAMPLE_PLANS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("offers a road runner only the marathon demo", () => {
    expect(examplesFor(["runner"]).map((e) => e.key)).toEqual(["marathon"]);
  });

  it("offers ultra runners the long formats", () => {
    expect(examplesFor(["ultra"]).map((e) => e.key)).toEqual([
      "ultra",
      "backyard",
    ]);
  });

  it("offers everything to someone who hasn't said what they do", () => {
    expect(examplesFor(undefined)).toHaveLength(EXAMPLE_PLANS.length);
    expect(examplesFor([])).toHaveLength(EXAMPLE_PLANS.length);
  });

  it("returns nothing for a sport with no demo yet", () => {
    // Empty is a real answer here, distinct from "no profile" — the card has to
    // tell the user those plans don't exist rather than showing a stale list.
    expect(examplesFor(["cyclist"])).toEqual([]);
    expect(examplesFor(["swimmer", "triathlete"])).toEqual([]);
  });

  it("names the sports that have no demo yet", () => {
    expect(athleteTypesWithoutExample(["runner", "cyclist"])).toEqual([
      "cyclist",
    ]);
    expect(athleteTypesWithoutExample(["trail", "ultra"])).toEqual([]);
    expect(athleteTypesWithoutExample(undefined)).toEqual([]);
  });

  it("seeds the demo matching what the athlete identifies with first", () => {
    // A trail runner is *eligible* for the marathon demo, but shouldn't be
    // handed it.
    expect(defaultExampleFor(["trail"]).key).toBe("trail");
    expect(defaultExampleFor(["ultra"]).key).toBe("ultra");
    expect(defaultExampleFor(["runner"]).key).toBe("marathon");
    expect(defaultExampleFor(["cyclist", "runner"]).key).toBe("marathon");
  });

  it("falls back to the marathon demo for sports without one yet", () => {
    // Cycling, swimming and triathlon demos are blocked on `Workout.sport`.
    // Showing an empty app on first run would be worse than the wrong sport.
    expect(defaultExampleFor(["cyclist"]).key).toBe("marathon");
    expect(defaultExampleFor(["triathlete"]).key).toBe("marathon");
  });
});

describe("generated example plans", () => {
  it.each(["trail", "ultra", "backyard"] as const)(
    "builds %s with a future race and logged history",
    (key) => {
      const plan = buildGeneratedExample(key, NOW);
      const today = "2026-08-08";

      expect(plan.isExample).toBe(true);
      expect(plan.raceDate > today).toBe(true);
      expect(plan.startDate! < today).toBe(true);
      expect(plan.weeks.length).toBeGreaterThan(8);

      const workouts = Object.values(plan.workouts);
      const done = workouts.filter((w) => w.completed);
      // A demo with no history has no stats and nothing to show.
      expect(done.length).toBeGreaterThan(0);
      expect(done.every((w) => w.date < today)).toBe(true);
      expect(workouts.every((w) => w.completed || w.date >= today)).toBe(true);
      expect(done.every((w) => w.actualPace && w.durationMin)).toBe(true);
    },
  );

  it("is deterministic, so a reload doesn't change the demo's stats", () => {
    const a = buildGeneratedExample("trail", NOW);
    const b = buildGeneratedExample("trail", NOW);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("puts the race on the final Sunday", () => {
    const plan = buildGeneratedExample("ultra", NOW);
    expect(new Date(plan.raceDate).getDay()).toBe(0);
    expect(plan.raceDate).toBe(plan.weeks.at(-1)!.endDate);
  });

  it("carries the backyard format through to the plan", () => {
    const plan = buildGeneratedExample("backyard", NOW);
    expect(plan.raceType).toBe("backyard");
    expect(plan.targetYards).toBe(20);
    expect(plan.raceDistanceKm).toBeCloseTo(134.1, 1);
  });

  it("keeps every workout inside its own week", () => {
    const plan = buildGeneratedExample("trail", NOW);
    for (const week of plan.weeks) {
      for (const id of week.workoutIds) {
        const w = plan.workouts[id];
        expect(w).toBeDefined();
        expect(w.weekNumber).toBe(week.weekNumber);
        expect(w.date >= week.startDate && w.date <= week.endDate).toBe(true);
      }
    }
  });
});
