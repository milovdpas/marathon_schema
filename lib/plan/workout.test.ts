import { describe, expect, it } from "vitest";
import { makeWorkout } from "@/lib/test/factories";
import {
  flexibleWindowIndex,
  groupByDate,
  isLogged,
  isMultiSport,
  planSports,
  workoutSport,
} from "@/lib/plan/workout";
import type { Sport } from "@/lib/sport";
import type { TrainingPlan } from "@/lib/types";

describe("isLogged", () => {
  it("is true when completed", () => {
    expect(isLogged(makeWorkout({ id: "a", completed: true }))).toBe(true);
  });

  it("is true when a distance was recorded but the box isn't ticked", () => {
    expect(isLogged(makeWorkout({ id: "a", actualDistanceKm: 8.2 }))).toBe(true);
  });

  it("treats a recorded 0 km as logged", () => {
    // `0 != null` — deliberate. Someone who recorded a zero-distance session
    // did record something, and several call sites rely on this to decide what
    // survives a re-import.
    expect(isLogged(makeWorkout({ id: "a", actualDistanceKm: 0 }))).toBe(true);
  });

  it("is false for an untouched planned workout", () => {
    expect(isLogged(makeWorkout({ id: "a" }))).toBe(false);
  });
});

describe("groupByDate", () => {
  it("buckets workouts by their scheduled date, preserving order", () => {
    const map = groupByDate([
      makeWorkout({ id: "a", date: "2026-06-22" }),
      makeWorkout({ id: "b", date: "2026-06-23" }),
      makeWorkout({ id: "c", date: "2026-06-22" }),
    ]);
    expect([...map.keys()]).toEqual(["2026-06-22", "2026-06-23"]);
    expect(map.get("2026-06-22")!.map((w) => w.id)).toEqual(["a", "c"]);
  });

  it("returns an empty map for no workouts", () => {
    expect(groupByDate([]).size).toBe(0);
  });
});

describe("flexibleWindowIndex", () => {
  it("covers every day of an inclusive window", () => {
    const map = flexibleWindowIndex([
      makeWorkout({
        id: "flex",
        flexible: true,
        windowStart: "2026-06-26",
        windowEnd: "2026-06-28",
        date: "2026-06-28",
      }),
    ]);
    expect([...map.keys()]).toEqual(["2026-06-26", "2026-06-27", "2026-06-28"]);
    expect(map.get("2026-06-27")!.map((w) => w.id)).toEqual(["flex"]);
  });

  it("ignores workouts that aren't flexible or lack bounds", () => {
    const map = flexibleWindowIndex([
      makeWorkout({ id: "plain", date: "2026-06-22" }),
      makeWorkout({ id: "halfFlex", flexible: true, windowStart: "2026-06-26" }),
    ]);
    expect(map.size).toBe(0);
  });

  it("lists several workouts choosable on the same day", () => {
    const flex = (id: string) =>
      makeWorkout({
        id,
        flexible: true,
        windowStart: "2026-06-27",
        windowEnd: "2026-06-28",
        date: "2026-06-27",
      });
    const map = flexibleWindowIndex([flex("a"), flex("b")]);
    expect(map.get("2026-06-27")!.map((w) => w.id)).toEqual(["a", "b"]);
  });
});

describe("workoutSport", () => {
  const plan = (sport?: Sport) => ({ sport }) as TrainingPlan;

  it("reads a workout with no sport, in a plan with no sport, as a run", () => {
    // Every workout written before multi-sport lands here, which is why none
    // of them needed backfilling.
    expect(workoutSport({}, plan())).toBe("run");
    expect(workoutSport({}, null)).toBe("run");
  });

  it("inherits the plan's sport when the workout doesn't name one", () => {
    // The reason an absent sport is NOT stamped as "run" at import: a cycling
    // plan says "bike" once and every session follows.
    expect(workoutSport({}, plan("bike"))).toBe("bike");
    expect(workoutSport({}, plan("swim"))).toBe("swim");
  });

  it("lets a workout override its plan, for cross-training", () => {
    expect(workoutSport({ sport: "bike" }, plan("run"))).toBe("bike");
  });
});

describe("planSports", () => {
  const build = (sports: (Sport | undefined)[], planSport?: Sport) =>
    ({
      sport: planSport,
      workouts: Object.fromEntries(
        sports.map((s, i) => [String(i), { sport: s }]),
      ),
    }) as unknown as TrainingPlan;

  it("reports one sport for a plain running plan", () => {
    expect(planSports(build([undefined, undefined]))).toEqual(["run"]);
    expect(isMultiSport(build([undefined, undefined]))).toBe(false);
  });

  it("notices a single cross-training session", () => {
    const plan = build([undefined, "bike"]);
    expect(planSports(plan)).toEqual(["run", "bike"]);
    expect(isMultiSport(plan)).toBe(true);
  });

  it("returns them in a stable order, not insertion order", () => {
    // Otherwise the stat cards reshuffle as sessions get logged.
    expect(planSports(build(["swim", "bike", "run"]))).toEqual([
      "run",
      "bike",
      "swim",
    ]);
  });

  it("falls back to the plan's sport when it has no workouts yet", () => {
    expect(planSports(build([], "bike"))).toEqual(["bike"]);
  });
});
