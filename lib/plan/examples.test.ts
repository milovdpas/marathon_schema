import { describe, expect, it } from "vitest";
import { DEFAULT_PLAN_ID } from "@/lib/plan/defaults";
import { buildGeneratedExample } from "@/lib/plan/example-specs";
import { isMultiSport, planSports } from "@/lib/plan/workout";
import { ATHLETE_TYPES } from "@/lib/types";
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

  it("treats an unset profile as a runner, not as 'show everything'", () => {
    // Offering a swimming plan to someone who has never swum is clutter, which
    // is a different question from hiding a feature (see `capabilitiesFor`).
    expect(examplesFor(undefined).map((e) => e.key)).toEqual(["marathon"]);
    expect(examplesFor([]).map((e) => e.key)).toEqual(["marathon"]);
  });

  it("never offers another sport's plan to a runner", () => {
    for (const types of [undefined, [], ["runner"], ["trail"], ["ultra"]] as const) {
      const keys = examplesFor(types).map((e) => e.key);
      expect(keys).not.toContain("cycling");
      expect(keys).not.toContain("swimming");
      expect(keys).not.toContain("triathlon");
    }
  });

  it("offers cyclists and swimmers their own demos", () => {
    expect(examplesFor(["cyclist"]).map((e) => e.key)).toEqual(["cycling"]);
    expect(examplesFor(["swimmer"]).map((e) => e.key)).toEqual(["swimming"]);
  });

  it("offers a triathlete the triathlon demo", () => {
    expect(examplesFor(["triathlete"]).map((e) => e.key)).toEqual(["triathlon"]);
  });

  it("names the athlete types that still have no demo", () => {
    // Empty is a real answer, distinct from "no profile": the card has to say
    // those plans don't exist rather than silently showing a stale list.
    expect(athleteTypesWithoutExample(["runner", "cyclist"])).toEqual([]);
    expect(athleteTypesWithoutExample(["trail", "ultra"])).toEqual([]);
    expect(athleteTypesWithoutExample(undefined)).toEqual([]);
  });

  it("seeds the demo matching what the athlete identifies with first", () => {
    // A trail runner is *eligible* for the marathon demo, but shouldn't be
    // handed it.
    expect(defaultExampleFor(["trail"]).key).toBe("trail");
    expect(defaultExampleFor(["ultra"]).key).toBe("ultra");
    expect(defaultExampleFor(["runner"]).key).toBe("marathon");
    // Primary is the first pick, so a cyclist-who-also-runs gets cycling.
    expect(defaultExampleFor(["cyclist", "runner"]).key).toBe("cycling");
    expect(defaultExampleFor(["runner", "cyclist"]).key).toBe("marathon");
  });

  it("seeds a cyclist a cycling plan, and a swimmer a swimming one", () => {
    expect(defaultExampleFor(["cyclist"]).key).toBe("cycling");
    expect(defaultExampleFor(["swimmer"]).key).toBe("swimming");
  });

  it("seeds a triathlete the triathlon demo", () => {
    expect(defaultExampleFor(["triathlete"]).key).toBe("triathlon");
  });

  it("covers every athlete type, so nothing falls back silently", () => {
    for (const t of ATHLETE_TYPES) {
      expect(athleteTypesWithoutExample([t])).toEqual([]);
    }
  });
});

describe("generated example plans", () => {
  it.each(["trail", "ultra", "backyard", "cycling", "swimming", "triathlon"] as const)(
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

describe("multi-sport demos", () => {
  it("stamps the plan's sport, not each workout's", () => {
    // Workouts inherit it, which is exactly why an absent workout sport is
    // never rewritten at import.
    const bike = buildGeneratedExample("cycling", NOW);
    expect(bike.sport).toBe("bike");
    expect(Object.values(bike.workouts).every((w) => w.sport === undefined)).toBe(
      true,
    );
    expect(buildGeneratedExample("swimming", NOW).sport).toBe("swim");
  });

  it("leaves running demos with no sport at all", () => {
    // Absent means running, so stamping it would only add noise to the export.
    expect(buildGeneratedExample("trail", NOW).sport).toBeUndefined();
  });

  it("keeps a race-week taper in every sport", () => {
    // The taper rule used to be "drop anything over 12 km", which removed every
    // session from a cycling week and none from a swimming one.
    for (const key of ["cycling", "swimming", "trail"] as const) {
      const plan = buildGeneratedExample(key, NOW);
      const raceWeek = plan.weeks.at(-1)!;
      expect(raceWeek.workoutIds.length).toBeGreaterThanOrEqual(2);
      expect(raceWeek.workoutIds.length).toBeLessThanOrEqual(4);
    }
  });
});

describe("the triathlon demo", () => {
  const tri = () => buildGeneratedExample("triathlon", NOW);

  it("names a sport on every session, and none on the plan", () => {
    // The one demo with no default sport: there is no sensible single answer.
    const plan = tri();
    expect(plan.sport).toBeUndefined();
    expect(
      Object.values(plan.workouts).every((w) => w.sport !== undefined),
    ).toBe(true);
  });

  it("covers all three sports", () => {
    expect(planSports(tri())).toEqual(["run", "bike", "swim"]);
    expect(isMultiSport(tri())).toBe(true);
  });

  it("puts three legs on race day, in order, on one date", () => {
    const plan = tri();
    const legs = Object.values(plan.workouts)
      .filter((w) => w.date === plan.raceDate)
      .sort((a, b) => a.id.localeCompare(b.id));
    expect(legs.map((l) => l.sport)).toEqual(["swim", "bike", "run"]);
    expect(new Set(legs.map((l) => l.date)).size).toBe(1);
  });

  it("keeps a brick's two sessions distinct on the same day", () => {
    // They share a date, so the id has to carry more than the weekday or one
    // would silently overwrite the other.
    const plan = tri();
    const sunday = Object.values(plan.workouts).filter((w) =>
      w.title.startsWith("Brick"),
    );
    expect(sunday.length).toBeGreaterThanOrEqual(2);
    expect(new Set(sunday.map((w) => w.id)).size).toBe(sunday.length);
  });
});
