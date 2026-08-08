// Where the athlete is, inferred from the browser and nothing else.
//
// **Never IP geolocation, and never the weather feature's device location.**
// The first screen of onboarding promises that nothing about you is sent
// anywhere, and both of those would break that promise to answer a question
// worth a default unit setting. `navigator.language` is already in every
// request header the browser sends; reading it locally reveals nothing new.
//
// The answer is a *default*, not a fact. It is wrong for anyone who travels,
// runs a US-English OS in Europe, or simply prefers the other system, which is
// why it is always overridable in Settings.

import type { UnitSystem } from "@/lib/units";

/**
 * The countries that use miles for road distance. Everywhere else is metric.
 *
 * The UK is the interesting one and is deliberately **metric** here: road signs
 * are in miles, but British distance runners train and race in kilometers
 * (parkrun is 5K, track is metric, and race distances are quoted in km). A UK
 * user who disagrees flips one switch; a UK user shown miles for every interval
 * session has to fight the app.
 */
const IMPERIAL_COUNTRIES = new Set(["US", "LR", "MM"]);

/** ISO 3166-1 alpha-2 -> the unit system to default to. */
export function unitsForCountry(country?: string): UnitSystem {
  if (!country) return "metric";
  return IMPERIAL_COUNTRIES.has(country.toUpperCase()) ? "imperial" : "metric";
}

/** A rough timezone -> country map, used only when the locale has no region. */
const TZ_COUNTRY: Record<string, string> = {
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Phoenix": "US",
  "America/Los_Angeles": "US",
  "America/Anchorage": "US",
  "Pacific/Honolulu": "US",
  "Europe/Amsterdam": "NL",
  "Europe/Brussels": "BE",
  "Europe/Berlin": "DE",
  "Europe/Paris": "FR",
  "Europe/London": "GB",
  "Europe/Madrid": "ES",
  "Europe/Rome": "IT",
};

/**
 * The user's country as ISO 3166-1 alpha-2, or undefined if it can't be told.
 *
 * `navigator.language` is the primary source because its region subtag is an
 * explicit statement of locale ("en-US", "nl-NL"). It frequently has no region
 * at all though ("en", "nl"), so the timezone is a fallback — and a partial
 * one, since a full IANA-to-country table is far more weight than a default
 * unit setting justifies. Undefined is a perfectly good answer: it means
 * metric, which is right for most of the world.
 */
export function detectCountry(): string | undefined {
  if (typeof navigator === "undefined") return undefined;

  const langs = [
    ...(navigator.languages ?? []),
    navigator.language,
  ].filter(Boolean);

  for (const tag of langs) {
    // "en-US" -> US. Also handles "zh-Hant-TW", where the region is last.
    const region = tag.split("-").find((p) => /^[A-Z]{2}$/.test(p));
    if (region) return region;
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz ? TZ_COUNTRY[tz] : undefined;
  } catch {
    return undefined;
  }
}

/** Country name for display, in the given locale. Falls back to the code. */
export function countryName(code: string, locale = "en"): string {
  try {
    return (
      new Intl.DisplayNames([locale], { type: "region" }).of(
        code.toUpperCase(),
      ) ?? code
    );
  } catch {
    return code;
  }
}
