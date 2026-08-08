import { describe, expect, it } from "vitest";
import {
  type BarEvent,
  buildBarEvents,
  placeBars,
  trackCount,
} from "@/lib/calendar/layout";
import { makeWorkout } from "@/lib/test/factories";

// Mon 2026-06-22 → Sun 2026-06-28.
const WEEK = [
  "2026-06-22",
  "2026-06-23",
  "2026-06-24",
  "2026-06-25",
  "2026-06-26",
  "2026-06-27",
  "2026-06-28",
];

const off = (patch: Partial<BarEvent> & { key: string; start: string; end: string }): BarEvent => ({
  label: "Off",
  kind: "off",
  ...patch,
});

describe("placeBars", () => {
  it("places a bar contained in the week", () => {
    const [bar] = placeBars(WEEK, [off({ key: "a", start: "2026-06-23", end: "2026-06-25" })]);
    expect(bar.startCol).toBe(1);
    expect(bar.span).toBe(3);
    expect(bar.continuesLeft).toBe(false);
    expect(bar.continuesRight).toBe(false);
    expect(bar.track).toBe(0);
  });

  it("clips a bar that runs past both edges and flags the overflow", () => {
    const [bar] = placeBars(WEEK, [off({ key: "a", start: "2026-06-01", end: "2026-07-30" })]);
    expect(bar.startCol).toBe(0);
    expect(bar.span).toBe(7);
    expect(bar.startIso).toBe("2026-06-22"); // clipped to the week
    expect(bar.continuesLeft).toBe(true);
    expect(bar.continuesRight).toBe(true);
  });

  it("stacks overlapping bars onto separate tracks", () => {
    const bars = placeBars(WEEK, [
      off({ key: "a", start: "2026-06-22", end: "2026-06-25" }),
      off({ key: "b", start: "2026-06-24", end: "2026-06-27" }),
    ]);
    expect(bars.map((b) => b.track)).toEqual([0, 1]);
    expect(trackCount(bars)).toBe(2);
  });

  it("reuses a track once its previous bar has ended", () => {
    const bars = placeBars(WEEK, [
      off({ key: "a", start: "2026-06-22", end: "2026-06-23" }),
      off({ key: "b", start: "2026-06-26", end: "2026-06-27" }),
    ]);
    expect(bars.map((b) => b.track)).toEqual([0, 0]);
    expect(trackCount(bars)).toBe(1);
  });

  it("drops bars that miss the week entirely", () => {
    expect(placeBars(WEEK, [off({ key: "a", start: "2026-07-01", end: "2026-07-03" })])).toEqual([]);
    expect(trackCount([])).toBe(0);
  });

  it("sets chosenOffset only when the planned day is visible", () => {
    const flex = (start: string, end: string, chosenDate: string): BarEvent => ({
      key: "f",
      start,
      end,
      label: "Long run",
      kind: "flex",
      type: "long",
      chosenDate,
    });
    const [inside] = placeBars(WEEK, [flex("2026-06-23", "2026-06-25", "2026-06-24")]);
    expect(inside.chosenOffset).toBe(1); // column 2, bar starts at column 1

    // Window starts before the week and the chosen day is in the hidden part.
    const [outside] = placeBars(WEEK, [flex("2026-06-20", "2026-06-25", "2026-06-21")]);
    expect(outside.chosenOffset).toBeUndefined();
  });

  it("does not mutate the events it is given", () => {
    const events = [
      off({ key: "b", start: "2026-06-25", end: "2026-06-26" }),
      off({ key: "a", start: "2026-06-22", end: "2026-06-23" }),
    ];
    const order = events.map((e) => e.key);
    placeBars(WEEK, events);
    expect(events.map((e) => e.key)).toEqual(order);
  });
});

describe("buildBarEvents", () => {
  it("includes off days and only fully-bounded flexible workouts", () => {
    const events = buildBarEvents(
      [{ id: "o1", start: "2026-06-22", end: "2026-06-23", title: "Vacation" }],
      [
        makeWorkout({
          id: "flex",
          flexible: true,
          windowStart: "2026-06-27",
          windowEnd: "2026-06-28",
          date: "2026-06-28",
          type: "long",
        }),
        // flexible but missing bounds — not renderable as a bar
        makeWorkout({ id: "halfFlex", flexible: true, windowStart: "2026-06-27" }),
        makeWorkout({ id: "plain" }),
      ],
    );
    expect(events.map((e) => e.key)).toEqual(["off-o1", "flex-flex"]);
    expect(events[1]).toMatchObject({ kind: "flex", type: "long", chosenDate: "2026-06-28" });
  });
});
