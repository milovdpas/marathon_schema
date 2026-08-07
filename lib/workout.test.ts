import { describe, expect, it } from "vitest";
import { makeWorkout } from "./test-factories";
import { flexibleWindowIndex, groupByDate, isLogged } from "./workout";

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
