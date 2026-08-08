import { describe, expect, it } from "vitest";
import { capabilitiesFor, showsSport } from "./athlete";

describe("capabilitiesFor", () => {
  it("shows everything when the user has never been asked", () => {
    const caps = capabilitiesFor(undefined);
    expect(caps.ultraFormats).toBe(true);
    expect(caps.multiSport).toBe(true);
    expect([...caps.sports].sort()).toEqual(["bike", "run", "swim"]);
  });

  it("shows everything when the user declined to answer", () => {
    // `[]` means "asked and declined" — a different thing from `undefined` to
    // the prompt, but the same thing to the UI.
    expect(capabilitiesFor([])).toBe(capabilitiesFor(undefined));
  });

  it("gives a plain runner only running, and no ultra formats", () => {
    const caps = capabilitiesFor(["runner"]);
    expect([...caps.sports]).toEqual(["run"]);
    expect(caps.ultraFormats).toBe(false);
    expect(caps.multiSport).toBe(false);
    expect(caps.trail).toBe(false);
  });

  it("unlocks ultra formats for ultra and trail runners", () => {
    expect(capabilitiesFor(["ultra"]).ultraFormats).toBe(true);
    expect(capabilitiesFor(["trail"]).ultraFormats).toBe(true);
    expect(capabilitiesFor(["trail"]).trail).toBe(true);
    expect(capabilitiesFor(["ultra"]).trail).toBe(false);
  });

  it("gives a triathlete all three sports", () => {
    const caps = capabilitiesFor(["triathlete"]);
    expect([...caps.sports].sort()).toEqual(["bike", "run", "swim"]);
    expect(caps.multiSport).toBe(true);
  });

  it("unions the sports of every selected type", () => {
    const caps = capabilitiesFor(["cyclist", "swimmer"]);
    expect([...caps.sports].sort()).toEqual(["bike", "swim"]);
    expect(showsSport(caps, "run")).toBe(false);
    expect(showsSport(caps, "bike")).toBe(true);
  });

  it("takes the primary from the order the user picked", () => {
    expect(capabilitiesFor(["cyclist", "runner"]).primary).toBe("cyclist");
    expect(capabilitiesFor(["runner", "cyclist"]).primary).toBe("runner");
  });

  it("returns a stable object so consumers don't re-render", () => {
    expect(capabilitiesFor(["runner", "cyclist"])).toBe(
      capabilitiesFor(["runner", "cyclist"]),
    );
  });

  it("does not conflate two selections that differ only in order", () => {
    // They carry different `primary` values, so caching them under one key
    // would hand the second caller the first caller's answer.
    expect(capabilitiesFor(["runner", "cyclist"])).not.toBe(
      capabilitiesFor(["cyclist", "runner"]),
    );
  });
});
