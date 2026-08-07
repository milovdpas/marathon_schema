import { describe, expect, it } from "vitest";
import {
  findMatchingPlanId,
  mergeLoggedWorkouts,
  rekeyCollidingWorkouts,
  weekIndexForDate,
} from "./plan-merge";
import { makePlan, makeWeek, makeWorkout } from "./test-factories";

describe("findMatchingPlanId", () => {
  it("matches on plan id before looking at workouts", () => {
    const existing = { p1: makePlan({ id: "p1" }), p2: makePlan({ id: "p2" }) };
    expect(findMatchingPlanId(existing, makePlan({ id: "p2" }))).toBe("p2");
  });

  it("picks the plan sharing the most workout ids", () => {
    const existing = {
      a: makePlan({
        id: "a",
        workouts: { w1: makeWorkout({ id: "w1" }) },
      }),
      b: makePlan({
        id: "b",
        workouts: {
          w2: makeWorkout({ id: "w2" }),
          w3: makeWorkout({ id: "w3" }),
        },
      }),
    };
    const imported = makePlan({
      id: "fresh",
      workouts: {
        w2: makeWorkout({ id: "w2" }),
        w3: makeWorkout({ id: "w3" }),
        w1: makeWorkout({ id: "w1" }),
      },
    });
    expect(findMatchingPlanId(existing, imported)).toBe("b");
  });

  it("returns null when nothing overlaps, so the import lands as a new plan", () => {
    const existing = { a: makePlan({ id: "a", workouts: { w1: makeWorkout({ id: "w1" }) } }) };
    const imported = makePlan({ id: "fresh", workouts: { zz: makeWorkout({ id: "zz" }) } });
    expect(findMatchingPlanId(existing, imported)).toBeNull();
  });
});

describe("rekeyCollidingWorkouts", () => {
  it("remaps all three places an id lives", () => {
    const plan = makePlan({
      workouts: { dup: makeWorkout({ id: "dup" }), safe: makeWorkout({ id: "safe" }) },
      weeks: [makeWeek({ workoutIds: ["dup", "safe"] })],
    });
    const out = rekeyCollidingWorkouts(plan, new Set(["dup"]));

    const ids = Object.keys(out.workouts);
    const fresh = ids.find((id) => id !== "safe")!;
    expect(fresh).not.toBe("dup");
    // record key, workout.id and week.workoutIds must all move together
    expect(out.workouts[fresh].id).toBe(fresh);
    expect(out.weeks[0].workoutIds).toContain(fresh);
    expect(out.weeks[0].workoutIds).not.toContain("dup");
    // untouched ids stay put
    expect(out.workouts.safe.id).toBe("safe");
  });

  it("returns the same object when nothing collides", () => {
    const plan = makePlan({ workouts: { w1: makeWorkout({ id: "w1" }) } });
    expect(rekeyCollidingWorkouts(plan, new Set(["other"]))).toBe(plan);
  });
});

describe("mergeLoggedWorkouts", () => {
  const source = makePlan({
    workouts: {
      w1: makeWorkout({
        id: "w1",
        title: "Old title",
        completed: true,
        date: "2026-06-24",
        actualDistanceKm: 10.2,
        actualPace: "5:01",
        durationMin: 51.2,
        notes: "felt good",
      }),
    },
  });

  it("keeps the logged result but takes the import's planned structure", () => {
    const imported = makePlan({
      workouts: {
        w1: makeWorkout({
          id: "w1",
          title: "New title from the AI",
          plannedDistanceKm: 12,
          date: "2026-06-22",
        }),
      },
    });
    const out = mergeLoggedWorkouts(imported, source);
    expect(out.workouts.w1.title).toBe("New title from the AI");
    expect(out.workouts.w1.plannedDistanceKm).toBe(12);
    expect(out.workouts.w1.actualDistanceKm).toBe(10.2);
    expect(out.workouts.w1.completed).toBe(true);
    // A completed run keeps the date it was actually run on.
    expect(out.workouts.w1.date).toBe("2026-06-24");
  });

  it("re-attaches a logged workout the import dropped", () => {
    const imported = makePlan({
      workouts: { other: makeWorkout({ id: "other", date: "2026-06-23" }) },
      weeks: [makeWeek({ workoutIds: ["other"] })],
    });
    const out = mergeLoggedWorkouts(imported, source);
    expect(out.workouts.w1).toBeDefined();
    expect(out.weeks[0].workoutIds).toContain("w1");
  });

  it("leaves behind a logged workout outside the new plan's date range", () => {
    const imported = makePlan({
      workouts: {},
      weeks: [makeWeek({ startDate: "2026-09-01", endDate: "2026-09-07", workoutIds: [] })],
    });
    const out = mergeLoggedWorkouts(imported, source);
    expect(out.workouts.w1).toBeUndefined();
  });

  it("is a no-op when the source has nothing logged", () => {
    const empty = makePlan({ workouts: { w1: makeWorkout({ id: "w1" }) } });
    const imported = makePlan({ workouts: { w1: makeWorkout({ id: "w1", title: "New" }) } });
    expect(mergeLoggedWorkouts(imported, empty)).toBe(imported);
  });

  it("treats actualDistanceKm: 0 as logged", () => {
    const zeroed = makePlan({
      workouts: {
        w1: makeWorkout({ id: "w1", completed: false, actualDistanceKm: 0, notes: "aborted" }),
      },
    });
    const imported = makePlan({ workouts: { w1: makeWorkout({ id: "w1", title: "New" }) } });
    const out = mergeLoggedWorkouts(imported, zeroed);
    expect(out.workouts.w1.actualDistanceKm).toBe(0);
    expect(out.workouts.w1.notes).toBe("aborted");
  });
});

describe("weekIndexForDate", () => {
  const plan = makePlan({
    weeks: [
      makeWeek({ weekNumber: 1, startDate: "2026-06-22", endDate: "2026-06-28" }),
      makeWeek({ weekNumber: 2, startDate: "2026-06-29", endDate: "2026-07-05" }),
    ],
  });

  it("finds the containing week, inclusive of both ends", () => {
    expect(weekIndexForDate(plan, "2026-06-22")).toBe(0);
    expect(weekIndexForDate(plan, "2026-06-28")).toBe(0);
    expect(weekIndexForDate(plan, "2026-06-29")).toBe(1);
  });

  it("returns -1 outside every week", () => {
    expect(weekIndexForDate(plan, "2026-08-01")).toBe(-1);
  });
});
