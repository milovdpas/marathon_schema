"use client";

import { useEffect } from "react";
import { detectCountry } from "@/lib/region";
import { useTrainingStore } from "@/store/use-training-store";

/**
 * Records the athlete's country once, on first run, so units can default
 * sensibly and the AI knows where a plan is being run.
 *
 * Writes only when `country` is absent, so a user who corrected it in Settings
 * is never overwritten by their browser locale.
 *
 * Safe to run on every load: `setPreferences` does not touch `lastModified`,
 * and the Drive auto-push subscribes to that alone — so this cannot trigger an
 * upload, let alone one per page view.
 */
export function RegionDetect() {
  const hydrated = useTrainingStore((s) => s.hydrated);
  const country = useTrainingStore((s) => s.preferences.country);
  const setPreferences = useTrainingStore((s) => s.setPreferences);

  useEffect(() => {
    if (!hydrated || country) return;
    const detected = detectCountry();
    // Undefined is a fine answer; it means metric. Storing "" would only make
    // the check above pass and stop us ever trying again.
    if (detected) setPreferences({ country: detected });
  }, [hydrated, country, setPreferences]);

  return null;
}
