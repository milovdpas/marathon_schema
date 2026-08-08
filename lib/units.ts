// Unit conversion, at the display edge only.
//
// **Everything is stored metric, forever**: distances in km, elevation in
// metres, temperature in °C, pace as seconds per km. Nothing in this file is
// allowed to change what gets persisted. That rule is what keeps a plan
// portable between two users on opposite sides of the Atlantic, keeps exports
// comparable, and means switching the toggle can never corrupt training data.
//
// The one place conversion runs in the other direction is user input
// (`toStoredDistance`), and even there the raw entry is converted once on save
// rather than round-tripped.

export type UnitSystem = "metric" | "imperial";

/** Exact, by international agreement since 1959. */
export const KM_PER_MILE = 1.609344;
const M_PER_FOOT = 0.3048;

export const isImperial = (u: UnitSystem) => u === "imperial";

// --- distance --------------------------------------------------------------

/** Stored km -> the number to show. */
export function toDisplayDistance(km: number, units: UnitSystem): number {
  return isImperial(units) ? km / KM_PER_MILE : km;
}

/** A number the user typed -> km to store. */
export function toStoredDistance(value: number, units: UnitSystem): number {
  return isImperial(units) ? value * KM_PER_MILE : value;
}

/** "km" or "mi", for labels and field suffixes. */
export function distanceUnit(units: UnitSystem): string {
  return isImperial(units) ? "mi" : "km";
}

/**
 * Round for display. One decimal matches how the app has always shown
 * distances; `decimals: 0` is for axis ticks and other tight spots.
 */
export function formatDistanceValue(
  km: number,
  units: UnitSystem,
  decimals = 1,
): string {
  const v = toDisplayDistance(km, units);
  return decimals === 0 ? String(Math.round(v)) : String(round(v, decimals));
}

/** e.g. "42.2 km" / "26.2 mi". */
export function formatDistance(
  km: number,
  units: UnitSystem,
  decimals = 1,
): string {
  return `${formatDistanceValue(km, units, decimals)} ${distanceUnit(units)}`;
}

// --- pace ------------------------------------------------------------------

/**
 * Seconds per km -> seconds per displayed unit.
 *
 * A mile is longer than a km, so a pace *per mile* is a bigger number: 5:00/km
 * is 8:03/mi. Getting this backwards is the classic bug, and it looks
 * plausible either way on screen, so it is pinned by a test.
 */
export function paceSecondsFor(
  secondsPerKm: number,
  units: UnitSystem,
): number {
  return isImperial(units) ? secondsPerKm * KM_PER_MILE : secondsPerKm;
}

/** The reverse, for a pace the user typed. */
export function paceSecondsToStored(
  secondsPerUnit: number,
  units: UnitSystem,
): number {
  return isImperial(units) ? secondsPerUnit / KM_PER_MILE : secondsPerUnit;
}

/** "/km" or "/mi". */
export function paceUnit(units: UnitSystem): string {
  return isImperial(units) ? "/mi" : "/km";
}

// --- elevation -------------------------------------------------------------

/** Stored metres -> feet, when imperial. Elevation is always a whole number. */
export function toDisplayElevation(m: number, units: UnitSystem): number {
  return Math.round(isImperial(units) ? m / M_PER_FOOT : m);
}

export function elevationUnit(units: UnitSystem): string {
  return isImperial(units) ? "ft" : "m";
}

// --- temperature -----------------------------------------------------------

/** Stored °C -> °F, when imperial. */
export function toDisplayTemp(c: number, units: UnitSystem): number {
  return isImperial(units) ? c * 1.8 + 32 : c;
}

/** "°C" or "°F". */
export function tempUnit(units: UnitSystem): string {
  return isImperial(units) ? "°F" : "°C";
}

/** e.g. "12°C" / "54°F". Whole degrees, as the weather badge has always shown. */
export function formatTemp(c: number, units: UnitSystem): string {
  return `${Math.round(toDisplayTemp(c, units))}${tempUnit(units)}`;
}

function round(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
