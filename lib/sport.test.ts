import { describe, expect, it } from "vitest";
import {
  displayToStoredPace,
  formatSpeed,
  formatSpeedValue,
  parseSpeedValue,
  speedUnit,
  storedPaceToDisplay,
  toSport,
} from "./sport";

describe("toSport", () => {
  it("passes real sports through", () => {
    expect(toSport("bike")).toBe("bike");
    expect(toSport("swim")).toBe("swim");
  });

  it("falls back to running for anything else", () => {
    // Every workout that predates multi-sport is a run, and an AI can emit
    // whatever it likes. Neither may crash a calendar cell.
    expect(toSport(undefined)).toBe("run");
    expect(toSport("triathlon")).toBe("run");
    expect(toSport(42)).toBe("run");
  });
});

describe("running", () => {
  it("shows minutes per km, or per mile", () => {
    expect(formatSpeed(298, "run", "metric")).toBe("4:58/km");
    expect(formatSpeed(298, "run", "imperial")).toBe("8:00/mi");
  });
});

describe("cycling", () => {
  it("shows speed, not pace, because nobody says 1:50/km on a bike", () => {
    // 120 s/km = 30 km/h
    expect(formatSpeed(120, "bike", "metric")).toBe("30 km/h");
    expect(speedUnit("bike", "metric")).toBe("km/h");
  });

  it("converts to mph", () => {
    expect(formatSpeed(120, "bike", "imperial")).toBe("18.6 mph");
  });

  it("inverts: FASTER is a bigger number", () => {
    const fast = Number(formatSpeedValue(100, "bike", "metric"));
    const slow = Number(formatSpeedValue(200, "bike", "metric"));
    // 100 s/km is quicker than 200 s/km, so its km/h must be higher — the
    // opposite of every pace-based sport.
    expect(fast).toBeGreaterThan(slow);
  });

  it("round-trips a typed speed", () => {
    const stored = parseSpeedValue("32.5", "bike", "metric");
    expect(formatSpeedValue(stored, "bike", "metric")).toBe("32.5");
  });

  it("accepts a comma decimal, as a Dutch keyboard produces", () => {
    expect(parseSpeedValue("32,5", "bike", "metric")).toBeCloseTo(
      parseSpeedValue("32.5", "bike", "metric")!,
      6,
    );
  });
});

describe("swimming", () => {
  it("shows minutes per 100 m", () => {
    // 1000 s/km = 100 s per 100 m = 1:40
    expect(formatSpeed(1000, "swim", "metric")).toBe("1:40/100m");
  });

  it("uses 100 yards when imperial, as a yards pool does", () => {
    expect(speedUnit("swim", "imperial")).toBe("/100yd");
    // 100 yd is shorter than 100 m, so the same swimmer's number is smaller.
    const m = parseSpeedValue("1:40", "swim", "metric")!;
    const yd = parseSpeedValue("1:40", "swim", "imperial")!;
    expect(yd).toBeGreaterThan(m);
  });

  it("round-trips a typed 100 m time", () => {
    const stored = parseSpeedValue("1:32", "swim", "metric");
    expect(formatSpeedValue(stored, "swim", "metric")).toBe("1:32");
  });
});

describe("stored <-> display", () => {
  it("round-trips a run pace through the display layer", () => {
    const display = storedPaceToDisplay("4:58", "run", "imperial");
    expect(display).toBe("8:00");
    expect(displayToStoredPace(display, "run", "imperial")).toBe("4:58");
  });

  it("round-trips a bike speed", () => {
    const display = storedPaceToDisplay("2:00", "bike", "metric"); // 120 s/km
    expect(display).toBe("30");
    expect(displayToStoredPace(display, "bike", "metric")).toBe("2:00");
  });

  it("leaves free-form text alone instead of inventing a number", () => {
    expect(storedPaceToDisplay("easy effort", "run", "metric")).toBe(
      "easy effort",
    );
  });

  it("returns an em dash for nothing at all", () => {
    expect(formatSpeed(null, "run", "metric")).toBe("—");
    expect(formatSpeed(0, "bike", "metric")).toBe("—");
  });
});
