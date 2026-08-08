import { describe, expect, it } from "vitest";
import { resolveLoggedRun } from "@/lib/pace";

const run = (distance: string, duration: string, pace: string) =>
  resolveLoggedRun({ distance, duration, pace });

describe("resolveLoggedRun", () => {
  it("derives pace from distance + duration and locks the pace field", () => {
    const r = run("10", "50:00", "");
    expect(r.actualDistanceKm).toBe(10);
    expect(r.durationMin).toBe(50);
    expect(r.actualPace).toBe("5:00");
    expect(r.computed).toBe("pace");
    // What's saved is what's shown.
    expect(r.paceFieldValue).toBe("5:00");
  });

  it("derives duration from distance + pace and locks the duration field", () => {
    const r = run("10", "", "5:00");
    expect(r.durationMin).toBe(50);
    expect(r.actualPace).toBe("5:00");
    expect(r.computed).toBe("duration");
    expect(r.durationFieldValue).toBe("50:00");
  });

  it("prefers the measured duration when both are given", () => {
    // Pace says 6:00 but the stopwatch says 50 minutes over 10 km.
    const r = run("10", "50:00", "6:00");
    expect(r.actualPace).toBe("5:00");
    expect(r.durationMin).toBe(50);
    expect(r.computed).toBe("pace");
  });

  it("keeps a free-form pace when nothing can be derived", () => {
    const r = run("", "", "about 5 min");
    expect(r.actualPace).toBe("about 5 min");
    expect(r.computed).toBeNull();
    expect(r.actualDistanceKm).toBeUndefined();
    expect(r.durationMin).toBeUndefined();
  });

  it("derives nothing from a zero-distance run", () => {
    // 0 km has no meaningful pace; `!distance` is falsy here on purpose.
    const r = run("0", "20:00", "");
    expect(r.actualDistanceKm).toBe(0);
    expect(r.durationMin).toBe(20);
    expect(r.actualPace).toBeUndefined();
    expect(r.computed).toBeNull();
  });

  it("passes through an empty form without inventing values", () => {
    const r = run("", "", "");
    expect(r).toMatchObject({
      actualDistanceKm: undefined,
      durationMin: undefined,
      actualPace: undefined,
      computed: null,
      paceFieldValue: "",
      durationFieldValue: "",
    });
  });

  it("accepts plain minutes and h:mm:ss for duration", () => {
    expect(run("10", "50", "").actualPace).toBe("5:00");
    expect(run("42.2", "3:30:00", "").actualPace).toBe("4:59");
  });

  it("ignores an unparseable pace rather than deriving a bogus duration", () => {
    const r = run("10", "", "not a pace");
    expect(r.durationMin).toBeUndefined();
    expect(r.actualPace).toBe("not a pace");
    expect(r.computed).toBeNull();
  });

  it("echoes the raw input in the field that is not computed", () => {
    const r = run("10", "50:00", "");
    expect(r.durationFieldValue).toBe("50:00");
  });
});
