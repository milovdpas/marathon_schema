"use client";

import { useEffect } from "react";
import { useTrainingStore } from "@/store/use-training-store";

/**
 * Returns whether the persisted store has rehydrated from localStorage.
 * Use this to avoid SSR/client markup mismatches — render a skeleton until true.
 */
export function useHydrated(): boolean {
  const hydrated = useTrainingStore((s) => s.hydrated);
  const plan = useTrainingStore((s) => s.plan);
  const initializePlan = useTrainingStore((s) => s.initializePlan);

  // Safety net: ensure a plan exists once hydrated (e.g. first ever visit).
  useEffect(() => {
    if (hydrated && !plan) initializePlan();
  }, [hydrated, plan, initializePlan]);

  return hydrated;
}
