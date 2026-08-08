import { afterEach, describe, expect, it, vi } from "vitest";
import { countryName, detectCountry, unitsForCountry } from "./region";

function stubNavigator(languages: string[], timeZone?: string) {
  vi.stubGlobal("navigator", { languages, language: languages[0] });
  if (timeZone) {
    vi.spyOn(Intl, "DateTimeFormat").mockReturnValue({
      resolvedOptions: () => ({ timeZone }),
    } as unknown as Intl.DateTimeFormat);
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("unitsForCountry", () => {
  it("gives the US miles", () => {
    expect(unitsForCountry("US")).toBe("imperial");
    expect(unitsForCountry("us")).toBe("imperial");
  });

  it("gives everywhere else kilometers", () => {
    expect(unitsForCountry("NL")).toBe("metric");
    expect(unitsForCountry("DE")).toBe("metric");
    expect(unitsForCountry("AU")).toBe("metric");
  });

  it("gives the UK kilometers, deliberately", () => {
    // Road signs are in miles, but British distance runners train in km.
    // Overridable in Settings either way.
    expect(unitsForCountry("GB")).toBe("metric");
  });

  it("defaults to metric when the country is unknown", () => {
    expect(unitsForCountry(undefined)).toBe("metric");
    expect(unitsForCountry("")).toBe("metric");
  });
});

describe("detectCountry", () => {
  it("reads the region subtag from the locale", () => {
    stubNavigator(["nl-NL", "en-US"]);
    expect(detectCountry()).toBe("NL");
  });

  it("finds the region even when it isn't the second part", () => {
    stubNavigator(["zh-Hant-TW"]);
    expect(detectCountry()).toBe("TW");
  });

  it("skips a language with no region and takes the next one", () => {
    stubNavigator(["en", "en-GB"]);
    expect(detectCountry()).toBe("GB");
  });

  it("falls back to the timezone when no locale carries a region", () => {
    stubNavigator(["en"], "America/Denver");
    expect(detectCountry()).toBe("US");
  });

  it("returns undefined rather than guessing", () => {
    // Undefined is a good answer: it means metric, right for most of the world.
    stubNavigator(["en"], "Antarctica/Troll");
    expect(detectCountry()).toBeUndefined();
  });

  it("is safe on the server, where there is no navigator", () => {
    vi.stubGlobal("navigator", undefined);
    expect(detectCountry()).toBeUndefined();
  });
});

describe("countryName", () => {
  it("resolves a code to a readable name", () => {
    expect(countryName("NL", "en")).toBe("Netherlands");
    expect(countryName("US", "en")).toBe("United States");
  });

  it("falls back to the code when Intl rejects it", () => {
    // A structurally invalid code throws a RangeError. Note "ZZ" does NOT: it
    // is CLDR's reserved "unknown region" and resolves to a real name, so the
    // fallback is for malformed input and Intl-less runtimes only.
    expect(countryName("!", "en")).toBe("!");
  });
});
