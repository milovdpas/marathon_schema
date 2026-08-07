import { describe, expect, it } from "vitest";
import { type ElevEntry, parsePartialKm, resolveElevations } from "./split-scanner";

describe("parsePartialKm", () => {
  it("accepts a real fraction", () => {
    expect(parsePartialKm("0.4")).toBe(0.4);
    expect(parsePartialKm("0,7")).toBe(0.7); // comma decimal
  });

  it("recovers a decimal point OCR dropped", () => {
    // "0.1" often comes back as "01" — without this it reads as km 1 or 11.
    expect(parsePartialKm("01")).toBe(0.1);
    expect(parsePartialKm("025")).toBe(0.25);
  });

  it("strips surrounding junk", () => {
    expect(parsePartialKm(" 0.3 km ")).toBe(0.3);
  });

  it("rejects anything that isn't a partial kilometre", () => {
    expect(parsePartialKm("1")).toBeNull(); // a whole km, not a remainder
    expect(parsePartialKm("12")).toBeNull();
    expect(parsePartialKm("1.5")).toBeNull(); // >= 1
    expect(parsePartialKm("0")).toBeNull();
    expect(parsePartialKm("00")).toBeNull();
    expect(parsePartialKm("")).toBeNull();
    expect(parsePartialKm("abc")).toBeNull();
  });
});

describe("resolveElevations", () => {
  // The column is right-aligned, so a leading "-" makes the box measurably
  // wider. `width` is what actually distinguishes -1 from 1.
  const e = (
    row: number,
    text: string,
    value: number,
    width: number,
    signed = false,
  ): ElevEntry => ({ row, text, value, width, signed });

  it("trusts an explicit sign from OCR", () => {
    const out = resolveElevations([
      e(0, "1", 1, 74),
      e(1, "-1", 1, 129, true),
      e(2, "2", 2, 74),
    ]);
    expect([...out.values()]).toEqual([1, -1, 2]);
  });

  it("infers a missing dash from the wider box", () => {
    // OCR dropped the 2px dash, but the box is still ~1.7x a bare digit.
    const out = resolveElevations([
      e(0, "1", 1, 74),
      e(1, "1", 1, 129),
      e(2, "1", 1, 74),
    ]);
    expect([...out.values()]).toEqual([1, -1, 1]);
  });

  it("re-reads a dash mistaken for a digit", () => {
    // "-1" came back as "41": wildly out of line and in a two-glyph box.
    const out = resolveElevations([
      e(0, "1", 1, 74),
      e(1, "2", 2, 74),
      e(2, "41", 41, 129),
      e(3, "1", 1, 74),
    ]);
    expect(out.get(2)).toBe(-1);
  });

  it("drops a reading it cannot salvage rather than inventing one", () => {
    const out = resolveElevations([
      e(0, "1", 1, 74),
      e(1, "2", 2, 74),
      e(2, "1234", 1234, 200),
      e(3, "1", 1, 74),
    ]);
    // No elevation beats a wrong one.
    expect(out.has(2)).toBe(false);
    expect(out.size).toBe(3);
  });

  it("keeps every reading on a genuinely hilly run", () => {
    // A two-digit "45" is as wide as a one-digit "-8", so the threshold has to
    // be per-glyph or this run comes back all-negative.
    const out = resolveElevations([
      e(0, "45", 45, 148),
      e(1, "38", 38, 148),
      e(2, "42", 42, 148),
      e(3, "40", 40, 148),
    ]);
    expect([...out.values()]).toEqual([45, 38, 42, 40]);
  });

  it("handles an empty list and a single row", () => {
    expect(resolveElevations([]).size).toBe(0);
    expect([...resolveElevations([e(0, "7", 7, 74)]).values()]).toEqual([7]);
  });
});
