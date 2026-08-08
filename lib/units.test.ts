import { describe, expect, it } from "vitest";
import {
  distanceUnit,
  formatDistance,
  formatTemp,
  KM_PER_MILE,
  paceSecondsFor,
  paceSecondsToStored,
  paceUnit,
  toDisplayDistance,
  toDisplayElevation,
  toDisplayTemp,
  toStoredDistance,
} from "./units";

describe("distance", () => {
  it("leaves metric alone", () => {
    expect(toDisplayDistance(42.2, "metric")).toBe(42.2);
    expect(toStoredDistance(42.2, "metric")).toBe(42.2);
  });

  it("shows a marathon as 26.2 miles", () => {
    expect(formatDistance(42.195, "imperial")).toBe("26.2 mi");
    expect(formatDistance(42.195, "metric")).toBe("42.2 km");
  });

  it("round-trips through storage without drifting", () => {
    // The user types 26.2 mi, we store km, they see 26.2 mi again. Drift here
    // would slowly rewrite their training every time they opened a dialog.
    const typed = 26.2;
    const stored = toStoredDistance(typed, "imperial");
    expect(toDisplayDistance(stored, "imperial")).toBeCloseTo(typed, 10);
  });

  it("labels the unit", () => {
    expect(distanceUnit("metric")).toBe("km");
    expect(distanceUnit("imperial")).toBe("mi");
  });

  it("can drop decimals for tight spots like axis ticks", () => {
    expect(formatDistance(42.195, "metric", 0)).toBe("42 km");
  });
});

describe("pace", () => {
  it("is a BIGGER number per mile, because a mile is longer", () => {
    // 5:00/km is 8:03/mi, not 3:06/mi. Both look plausible on screen, which is
    // exactly why this is pinned.
    const perKm = 5 * 60;
    expect(paceSecondsFor(perKm, "imperial")).toBeCloseTo(483.0, 0);
    expect(paceSecondsFor(perKm, "imperial")).toBeGreaterThan(perKm);
  });

  it("leaves metric alone", () => {
    expect(paceSecondsFor(298, "metric")).toBe(298);
  });

  it("round-trips a typed pace", () => {
    const typed = 8 * 60 + 3;
    expect(
      paceSecondsFor(paceSecondsToStored(typed, "imperial"), "imperial"),
    ).toBeCloseTo(typed, 10);
  });

  it("labels the unit", () => {
    expect(paceUnit("metric")).toBe("/km");
    expect(paceUnit("imperial")).toBe("/mi");
  });
});

describe("elevation", () => {
  it("converts metres to whole feet", () => {
    expect(toDisplayElevation(100, "imperial")).toBe(328);
    expect(toDisplayElevation(100, "metric")).toBe(100);
  });

  it("keeps the sign on a descent", () => {
    expect(toDisplayElevation(-10, "imperial")).toBe(-33);
  });
});

describe("temperature", () => {
  it("converts at the fixed points", () => {
    expect(toDisplayTemp(0, "imperial")).toBe(32);
    expect(toDisplayTemp(100, "imperial")).toBe(212);
    expect(toDisplayTemp(-40, "imperial")).toBe(-40);
  });

  it("leaves metric alone", () => {
    expect(toDisplayTemp(12.4, "metric")).toBe(12.4);
  });

  it("formats with the right symbol", () => {
    expect(formatTemp(12.4, "metric")).toBe("12°C");
    expect(formatTemp(12.4, "imperial")).toBe("54°F");
  });
});

describe("the conversion factor", () => {
  it("is the exact 1959 international value", () => {
    // Not 1.61 or 1.6093. Small errors compound across a 16-week block's
    // weekly totals and show up as an off-by-one in the stats.
    expect(KM_PER_MILE).toBe(1.609344);
  });
});
