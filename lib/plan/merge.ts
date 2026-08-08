// Reconciling an imported plan with what the user already has.
//
// The AI edits an exported plan and hands it back, so an import is usually an
// *update* to an existing plan rather than a new one. Getting that wrong loses
// logged training permanently — there is no backend to restore from — which is
// why this logic lives on its own and is tested.

import { newId } from "@/lib/id";
import type { TrainingPlan, Workout } from "@/lib/types";
import { isLogged } from "@/lib/plan/workout";

/** Find the week (by date range) that a given ISO date belongs to. */
export function weekIndexForDate(plan: TrainingPlan, date: string): number {
  return plan.weeks.findIndex((w) => date >= w.startDate && date <= w.endDate);
}

/**
 * Decide whether an imported plan is an *update* to one we already have, by
 * looking for shared workout ids (the AI edits the exported JSON, keeping ids).
 * Returns the existing plan id with the most overlap, or null for a new plan.
 */
export function findMatchingPlanId(
  plans: Record<string, TrainingPlan>,
  imported: TrainingPlan,
): string | null {
  if (imported.id && plans[imported.id]) return imported.id;
  const importedIds = new Set(Object.keys(imported.workouts));
  let best: string | null = null;
  let bestOverlap = 0;
  for (const [pid, pl] of Object.entries(plans)) {
    let overlap = 0;
    for (const wid of Object.keys(pl.workouts)) {
      if (importedIds.has(wid)) overlap += 1;
    }
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      best = pid;
    }
  }
  return bestOverlap > 0 ? best : null;
}

/**
 * Give any workout whose id is already taken by another plan a fresh one.
 *
 * When previous plans are attached as AI context, the model often reuses their
 * workout ids in the plan it returns. Left alone, `findMatchingPlanId` would
 * read that as "an update to the old plan" and overwrite the user's finished
 * training history. Re-keying first makes the new plan unambiguously new.
 */
export function rekeyCollidingWorkouts(
  plan: TrainingPlan,
  taken: Set<string>,
): TrainingPlan {
  const remap = new Map<string, string>();
  for (const id of Object.keys(plan.workouts)) {
    if (taken.has(id)) remap.set(id, newId());
  }
  if (remap.size === 0) return plan;

  // An id lives in three places: the record key, the workout's own `id`, and
  // the week's `workoutIds` — all three have to move together.
  const workouts: Record<string, Workout> = {};
  for (const [id, w] of Object.entries(plan.workouts)) {
    const next = remap.get(id) ?? id;
    workouts[next] = { ...w, id: next };
  }
  const weeks = plan.weeks.map((wk) => ({
    ...wk,
    workoutIds: wk.workoutIds.map((id) => remap.get(id) ?? id),
  }));
  return { ...plan, weeks, workouts };
}

/**
 * Overlay the user's finished sessions onto an imported plan. An AI-edited plan
 * is often built from an older export, so it can be "behind" — missing workouts
 * the user has since completed. Matched by id, we keep the logged result; any
 * logged workout the import dropped is re-attached to its week so it's not lost.
 */
export function mergeLoggedWorkouts(
  imported: TrainingPlan,
  source: TrainingPlan,
): TrainingPlan {
  const logged = new Map<string, Workout>();
  for (const w of Object.values(source.workouts)) {
    if (isLogged(w)) logged.set(w.id, w);
  }
  if (logged.size === 0) return imported;

  const workouts: Record<string, Workout> = {};
  for (const [wid, w] of Object.entries(imported.workouts)) {
    const prior = logged.get(wid);
    workouts[wid] = prior
      ? {
          ...w, // keep the imported planned structure (title, planned km, type…)
          completed: prior.completed,
          actualDistanceKm: prior.actualDistanceKm,
          actualPace: prior.actualPace,
          durationMin: prior.durationMin,
          notes: prior.notes ?? w.notes,
          date: prior.completed ? prior.date : w.date,
        }
      : w;
  }

  // Re-attach finished workouts the imported plan no longer contains.
  const weeks = imported.weeks.map((wk) => ({
    ...wk,
    workoutIds: [...wk.workoutIds],
  }));
  for (const [wid, w] of logged) {
    if (workouts[wid]) continue;
    const idx = weeks.findIndex(
      (wk) => w.date >= wk.startDate && w.date <= wk.endDate,
    );
    if (idx < 0) continue; // outside the new plan's range — leave it behind
    workouts[wid] = w;
    if (!weeks[idx].workoutIds.includes(wid)) weeks[idx].workoutIds.push(wid);
  }

  return { ...imported, weeks, workouts };
}
