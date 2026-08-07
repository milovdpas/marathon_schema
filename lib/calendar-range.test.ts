import { describe, expect, it } from "vitest";
import { stepAnchor, visibleDays } from "./calendar-range";
import { chunkWeeks, toISO } from "./date";

// A Wednesday, mid-month.
const ANCHOR = new Date(2026, 7, 12); // 2026-08-12
const TODAY = new Date(2026, 9, 7); // 2026-10-07, deliberately elsewhere

const isos = (ds: Date[]) => ds.map(toISO);

describe("visibleDays", () => {
  it("month covers whole Monday-aligned weeks around the anchor's month", () => {
    const days = visibleDays("month", ANCHOR, TODAY);
    expect(days.length % 7).toBe(0);
    expect(toISO(days[0])).toBe("2026-07-27"); // Monday before 1 Aug
    expect(toISO(days.at(-1)!)).toBe("2026-09-06"); // Sunday after 31 Aug
  });

  it("week and day both return the anchor's containing week", () => {
    const week = isos(visibleDays("week", ANCHOR, TODAY));
    const day = isos(visibleDays("day", ANCHOR, TODAY));
    expect(week).toHaveLength(7);
    expect(week[0]).toBe("2026-08-10"); // Monday
    // The day view feeds the weather hook a whole week, not a lone day.
    expect(day).toEqual(week);
  });

  it("agenda ignores the anchor and uses today's week", () => {
    // Otherwise it would fetch weather for a week the user isn't looking at.
    const days = isos(visibleDays("agenda", ANCHOR, TODAY));
    expect(days).toHaveLength(7);
    expect(days[0]).toBe("2026-10-05"); // Monday of TODAY's week
  });
});

describe("stepAnchor", () => {
  it("moves by the unit the view shows", () => {
    expect(toISO(stepAnchor("month", ANCHOR, 1))).toBe("2026-09-12");
    expect(toISO(stepAnchor("month", ANCHOR, -1))).toBe("2026-07-12");
    expect(toISO(stepAnchor("week", ANCHOR, 1))).toBe("2026-08-19");
    expect(toISO(stepAnchor("day", ANCHOR, -1))).toBe("2026-08-11");
  });

  it("steps agenda by a day, the harmless default (its arrows are hidden)", () => {
    expect(toISO(stepAnchor("agenda", ANCHOR, 1))).toBe("2026-08-13");
  });
});

describe("chunkWeeks", () => {
  it("splits a month grid into rows of seven", () => {
    const weeks = chunkWeeks(visibleDays("month", ANCHOR, TODAY));
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks).toHaveLength(6);
  });

  it("handles an empty list", () => {
    expect(chunkWeeks([])).toEqual([]);
  });
});
