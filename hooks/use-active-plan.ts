"use client";

import type { TrainingPlan } from "@/lib/types";
import { useTrainingStore } from "@/store/use-training-store";

/** The currently selected training plan, or null if none. */
export function useActivePlan(): TrainingPlan | null {
  return useTrainingStore((s) =>
    s.activePlanId ? (s.plans[s.activePlanId] ?? null) : null,
  );
}
