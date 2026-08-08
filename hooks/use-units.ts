"use client";

import { useTrainingStore } from "@/store/use-training-store";
import { unitsForCountry } from "@/lib/region";
import type { UnitSystem } from "@/lib/units";

/**
 * Which units to display in.
 *
 * Resolution order: an explicit choice in Settings, then the detected country,
 * then metric. The explicit choice has to win outright — someone who lives in
 * the US but trains in kilometers picks metric once and must never see it
 * revert because their locale still says `en-US`.
 *
 * Returns `"metric"` before hydration so the server and first client render
 * agree; the store's own `hydrated` flag gates anything that would flash.
 */
export function useUnits(): UnitSystem {
  const explicit = useTrainingStore((s) => s.preferences.units);
  const country = useTrainingStore((s) => s.preferences.country);
  return explicit ?? unitsForCountry(country);
}
