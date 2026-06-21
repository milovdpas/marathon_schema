"use client";

import { useMemo } from "react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { toISO } from "@/lib/date";
import {
  longRunProgression,
  mileageInRange,
  overallStats,
  recentCompleted,
  upcomingWorkouts,
  weeklyMileage,
} from "@/lib/stats";
import type { TrainingPlan } from "@/lib/types";
import { useTrainingStore } from "@/store/use-training-store";

/** Memoized derived statistics for the current plan. */
export function useStats(plan: TrainingPlan | null) {
  return useMemo(() => {
    if (!plan) return null;

    const now = new Date();
    const weekStart = toISO(startOfWeek(now, { weekStartsOn: 1 }));
    const weekEnd = toISO(endOfWeek(now, { weekStartsOn: 1 }));
    const monthStart = toISO(startOfMonth(now));
    const monthEnd = toISO(endOfMonth(now));
    const today = toISO(now);

    return {
      overall: overallStats(plan),
      thisWeek: mileageInRange(plan, weekStart, weekEnd),
      thisMonth: mileageInRange(plan, monthStart, monthEnd),
      weekly: weeklyMileage(plan),
      longRuns: longRunProgression(plan),
      upcoming: upcomingWorkouts(plan, today, 3),
      recent: recentCompleted(plan, 4),
    };
  }, [plan]);
}

/** Convenience hook reading the active plan straight from the store. */
export function usePlanStats() {
  const plan = useTrainingStore((s) =>
    s.activePlanId ? (s.plans[s.activePlanId] ?? null) : null,
  );
  return useStats(plan);
}
