"use client";

import { useEffect } from "react";
import { useTrainingStore } from "@/store/use-training-store";

/**
 * Returns whether the persisted store has rehydrated from localStorage.
 * Use this to avoid SSR/client markup mismatches — render a skeleton until true.
 */
export function useHydrated(): boolean {
  const hydrated = useTrainingStore((s) => s.hydrated);
  const hasPlans = useTrainingStore((s) => Object.keys(s.plans).length > 0);
  const initializePlan = useTrainingStore((s) => s.initializePlan);

  // Safety net: ensure a plan exists once hydrated (e.g. first ever visit).
  useEffect(() => {
    if (hydrated && !hasPlans) initializePlan();
  }, [hydrated, hasPlans, initializePlan]);

  return hydrated;
}
