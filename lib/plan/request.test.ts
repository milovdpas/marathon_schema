import { describe, expect, it } from "vitest";
import { type Draft, buildPlanRequest } from "@/lib/plan/request";
import { makePlan, makeWorkout } from "@/lib/test/factories";

const draft = (patch: Partial<Draft> = {}): Draft => ({
  name: "Autumn block",
  raceName: "Marathon",
  sport: "run",
  raceDistanceKm: 42.2,
  raceDate: "2026-10-11",
  startDate: "2026-06-22",
  raceType: "standard",
  loopKm: 6.706,
  targetYards: 24,
  goalType: "finish",
  goalValue: "",
  offDays: [],
  latestRuns: [],
  contextPlanIds: [],
  prefs: {
    daysPerWeek: 4,
    flexibleDays: false,
    trainingDays: [true, false, true, true, false, false, true],
    planningMode: "exact",
    targetDistanceKm: 30,
  },
  ...patch,
});

describe("buildPlanRequest", () => {
  it("emits the versioned envelope", () => {
    const r = buildPlanRequest(draft(), {});
    expect(r.app).toBe("marathon-tracker-plan-request");
    expect(r.version).toBe(2);
  });

  it("sends the chosen distance for a standard race", () => {
    const r = buildPlanRequest(draft({ raceDistanceKm: 21.1 }), {});
    expect(r.race).toMatchObject({ type: "standard", distanceKm: 21.1 });
    expect(r.race).not.toHaveProperty("loopKm");
    expect(r.goal).toEqual({ type: "finish", value: null });
  });

  it("derives distance and a yards goal for a backyard", () => {
    const r = buildPlanRequest(
      draft({ raceType: "backyard", targetYards: 24, loopKm: 6.706 }),
      {},
    );
    expect(r.race).toMatchObject({
      type: "backyard",
      distanceKm: 160.9, // 24 x 6.706, rounded to 1dp
      loopKm: 6.706,
      targetYards: 24,
    });
    expect(r.goal).toEqual({ type: "yards", value: "24" });
  });

  it("nulls an empty goal value but keeps a real one", () => {
    expect(buildPlanRequest(draft({ goalType: "time", goalValue: "  " }), {}).goal)
      .toEqual({ type: "time", value: null });
    expect(buildPlanRequest(draft({ goalType: "time", goalValue: "3:30" }), {}).goal)
      .toEqual({ type: "time", value: "3:30" });
  });

  it("converts latest runs to distance + minutes + pace, skipping blanks", () => {
    const r = buildPlanRequest(
      draft({
        latestRuns: [
          { distanceKm: "10", time: "50:00", date: "2026-06-20" },
          { distanceKm: "", time: "40:00", date: "2026-06-18" }, // no distance
        ],
      }),
      {},
    );
    expect(r.latestRuns).toEqual([
      { distanceKm: 10, durationMin: 50, pace: "5:00", date: "2026-06-20" },
    ]);
  });

  it("sends weekday names, or null when days are flexible", () => {
    expect(buildPlanRequest(draft(), {}).training.trainingDays).toEqual([
      "Monday",
      "Wednesday",
      "Thursday",
      "Sunday",
    ]);
    const flex = draft();
    flex.prefs = { ...flex.prefs, flexibleDays: true };
    expect(buildPlanRequest(flex, {}).training.trainingDays).toBeNull();
  });

  it("attaches selected previous plans as context", () => {
    const plans = {
      old: makePlan({
        id: "old",
        name: "Spring",
        workouts: { w1: makeWorkout({ id: "w1", completed: true, actualDistanceKm: 10 }) },
      }),
    };
    const r = buildPlanRequest(draft({ contextPlanIds: ["old"] }), plans);
    expect(r.previousPlans).toHaveLength(1);
    expect(r.previousPlans[0].name).toBe("Spring");
  });

  it("survives a context plan deleted while the wizard was open", () => {
    const r = buildPlanRequest(draft({ contextPlanIds: ["gone"] }), {});
    expect(r.previousPlans).toEqual([]);
  });
});
