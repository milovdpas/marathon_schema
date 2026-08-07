import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { deriveStartTime, paceFromDistanceDuration } from "@/lib/pace";
import {
  DEFAULT_OFF_DAYS,
  DEFAULT_PLAN_ID,
  DEFAULT_PLAN_META,
  DEFAULT_TRAINING_PREFS,
  generateDefaultPlan,
  MILO_SEED_RUNS,
  type GeneratePlanOptions,
} from "@/lib/plan-generator";
import { parseImport, serializeExport, STORAGE_KEY } from "@/lib/storage";
import type {
  OffDay,
  PlanMeta,
  Preferences,
  TrainingPlan,
  TrainingPrefs,
  Workout,
} from "@/lib/types";

const DEFAULT_PREFERENCES: Preferences = { theme: "system" };
const nowISO = () => new Date().toISOString();

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `plan-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}

interface TrainingState {
  plans: Record<string, TrainingPlan>;
  activePlanId: string | null;
  preferences: Preferences;
  hydrated: boolean;
  /** ISO timestamp of the last local mutation — used for sync conflict resolution. */
  lastModified: string;

  setHydrated: (v: boolean) => void;
  initializePlan: () => void;

  // Plan management
  addPlan: (opts?: GeneratePlanOptions) => string;
  /** Add an AI-built plan from imported JSON (does not replace existing plans). */
  addPlanFromImport: (
    json: string,
    opts?: {
      trainingPrefs?: TrainingPrefs;
      startDate?: string;
      /**
       * Always insert as a brand-new plan instead of updating one that shares
       * workout ids. Set when previous plans were shown to the AI as context,
       * since it may echo their ids back.
       */
      asNewPlan?: boolean;
    },
  ) => void;
  selectPlan: (id: string) => void;
  deletePlan: (id: string) => void;
  updatePlanMeta: (patch: Partial<PlanMeta>) => void;
  updateTrainingPrefs: (patch: Partial<TrainingPrefs>) => void;

  // Off days (operate on the active plan)
  addOffDay: (input: Omit<OffDay, "id">) => void;
  updateOffDay: (id: string, patch: Partial<Omit<OffDay, "id">>) => void;
  deleteOffDay: (id: string) => void;

  // Workout edits (operate on the active plan)
  toggleComplete: (id: string) => void;
  updateWorkout: (id: string, patch: Partial<Workout>) => void;
  addWorkout: (
    input: Omit<Workout, "id" | "weekNumber" | "completed"> &
      Partial<Pick<Workout, "completed">>,
  ) => string;
  deleteWorkout: (id: string) => void;

  setPreferences: (patch: Partial<Preferences>) => void;
  exportData: () => string;
  importData: (json: string) => void;
  applyRemote: (json: string, modifiedTime: string) => void;
}

/** Find the week (by date range) that a given ISO date belongs to. */
function weekIndexForDate(plan: TrainingPlan, date: string): number {
  return plan.weeks.findIndex((w) => date >= w.startDate && date <= w.endDate);
}

/** A workout the user has actually run/logged (worth preserving across re-import). */
function isLogged(w: Workout): boolean {
  return w.completed || w.actualDistanceKm != null;
}

/**
 * Decide whether an imported plan is an *update* to one we already have, by
 * looking for shared workout ids (the AI edits the exported JSON, keeping ids).
 * Returns the existing plan id with the most overlap, or null for a new plan.
 */
function findMatchingPlanId(
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
function rekeyCollidingWorkouts(
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
function mergeLoggedWorkouts(
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

/** Produce a state patch that replaces the active plan via `fn`. */
function mutateActive(
  state: TrainingState,
  fn: (plan: TrainingPlan) => TrainingPlan,
): Partial<TrainingState> {
  const id = state.activePlanId;
  const current = id ? state.plans[id] : null;
  if (!id || !current) return {};
  return {
    plans: { ...state.plans, [id]: fn(current) },
    lastModified: nowISO(),
  };
}

export const useTrainingStore = create<TrainingState>()(
  persist(
    (set, get) => ({
      plans: {},
      activePlanId: null,
      preferences: DEFAULT_PREFERENCES,
      hydrated: false,
      lastModified: "",

      setHydrated: (v) => set({ hydrated: v }),

      initializePlan: () => {
        if (Object.keys(get().plans).length > 0) return;
        // Fresh installs wait for onboarding to decide (create vs. example).
        if (!get().preferences.onboardingSeen) return;
        const plan = generateDefaultPlan({
          id: DEFAULT_PLAN_ID,
          seedRuns: MILO_SEED_RUNS,
          offDays: DEFAULT_OFF_DAYS,
          isExample: true,
        });
        set({
          plans: { [plan.id]: plan },
          activePlanId: plan.id,
          lastModified: nowISO(),
        });
      },

      addPlan: (opts) => {
        const plan = generateDefaultPlan(opts);
        set((s) => ({
          plans: { ...s.plans, [plan.id]: plan },
          activePlanId: plan.id,
          lastModified: nowISO(),
        }));
        return plan.id;
      },

      addPlanFromImport: (json, opts) => {
        const { trainingPrefs, startDate, asNewPlan } = opts ?? {};
        const { plans: imported } = parseImport(json);
        const entries = Object.values(imported);
        if (entries.length === 0) throw new Error("No plan found in file.");
        const existing = get().plans;
        const next = { ...existing };
        let activeId = get().activePlanId;
        // Ids already spoken for, so a forced-new plan can dodge them.
        const takenWorkoutIds = new Set(
          Object.values(existing).flatMap((pl) => Object.keys(pl.workouts)),
        );

        for (const raw of entries) {
          // `asNewPlan` short-circuits the update path: the AI saw previous
          // plans and may have echoed their ids, which would otherwise be read
          // as "update that plan" and wipe it.
          const p = asNewPlan
            ? rekeyCollidingWorkouts(raw, takenWorkoutIds)
            : raw;
          // If this import updates a plan we already have (shared workout ids),
          // replace it in place and carry over completed sessions — so a "behind"
          // AI plan never wipes finished workouts, and stats aren't double-counted.
          const targetId = asNewPlan ? null : findMatchingPlanId(existing, p);
          const source = targetId ? existing[targetId] : null;
          const merged = source ? mergeLoggedWorkouts(p, source) : p;
          const id = targetId ?? newId();
          next[id] = {
            ...merged,
            id,
            createdAt: source?.createdAt ?? merged.createdAt,
            trainingPrefs: trainingPrefs ?? p.trainingPrefs ?? source?.trainingPrefs,
            startDate: startDate ?? p.startDate ?? source?.startDate,
          };
          for (const wid of Object.keys(merged.workouts)) takenWorkoutIds.add(wid);
          activeId = id;
        }
        set({ plans: next, activePlanId: activeId, lastModified: nowISO() });
      },

      selectPlan: (id) => {
        if (!get().plans[id]) return;
        set({ activePlanId: id, lastModified: nowISO() });
      },

      deletePlan: (id) =>
        set((s) => {
          const plans = { ...s.plans };
          delete plans[id];
          let activePlanId = s.activePlanId;
          if (activePlanId === id) activePlanId = Object.keys(plans)[0] ?? null;
          if (Object.keys(plans).length === 0) {
            // Placeholder so the app is never planless — not the user's own
            // training, so keep it out of previous-plan context too.
            const def = generateDefaultPlan({ isExample: true });
            plans[def.id] = def;
            activePlanId = def.id;
          }
          return { plans, activePlanId, lastModified: nowISO() };
        }),

      updatePlanMeta: (patch) =>
        set((s) => mutateActive(s, (p) => ({ ...p, ...patch }))),

      updateTrainingPrefs: (patch) =>
        set((s) =>
          mutateActive(s, (p) => ({
            ...p,
            trainingPrefs: {
              ...DEFAULT_TRAINING_PREFS,
              ...p.trainingPrefs,
              ...patch,
            },
          })),
        ),

      addOffDay: (input) =>
        set((s) =>
          mutateActive(s, (p) => ({
            ...p,
            offDays: [...(p.offDays ?? []), { ...input, id: newId() }],
          })),
        ),

      updateOffDay: (id, patch) =>
        set((s) =>
          mutateActive(s, (p) => ({
            ...p,
            offDays: (p.offDays ?? []).map((o) =>
              o.id === id ? { ...o, ...patch } : o,
            ),
          })),
        ),

      deleteOffDay: (id) =>
        set((s) =>
          mutateActive(s, (p) => ({
            ...p,
            offDays: (p.offDays ?? []).filter((o) => o.id !== id),
          })),
        ),

      toggleComplete: (id) =>
        set((s) =>
          mutateActive(s, (p) => {
            const w = p.workouts[id];
            if (!w) return p;
            return {
              ...p,
              workouts: { ...p.workouts, [id]: { ...w, completed: !w.completed } },
            };
          }),
        ),

      updateWorkout: (id, patch) =>
        set((s) =>
          mutateActive(s, (p) => {
            const existing = p.workouts[id];
            if (!existing) return p;
            const merged: Workout = { ...existing, ...patch };
            if (
              patch.actualPace === undefined &&
              (patch.actualDistanceKm !== undefined ||
                patch.durationMin !== undefined)
            ) {
              const derived = paceFromDistanceDuration(
                merged.actualDistanceKm,
                merged.durationMin,
              );
              if (derived) merged.actualPace = derived;
            }
            return { ...p, workouts: { ...p.workouts, [id]: merged } };
          }),
        ),

      addWorkout: (input) => {
        const id = newId();
        set((s) =>
          mutateActive(s, (p) => {
            const idx = weekIndexForDate(p, input.date);
            const week = idx >= 0 ? p.weeks[idx] : undefined;
            const workout: Workout = {
              ...input,
              id,
              weekNumber: week?.weekNumber ?? 0,
              completed: input.completed ?? false,
              isCustom: true,
            };
            const weeks =
              idx >= 0
                ? p.weeks.map((w, i) =>
                    i === idx ? { ...w, workoutIds: [...w.workoutIds, id] } : w,
                  )
                : p.weeks;
            return { ...p, weeks, workouts: { ...p.workouts, [id]: workout } };
          }),
        );
        return id;
      },

      deleteWorkout: (id) =>
        set((s) =>
          mutateActive(s, (p) => {
            const workouts = { ...p.workouts };
            delete workouts[id];
            return {
              ...p,
              weeks: p.weeks.map((w) => ({
                ...w,
                workoutIds: w.workoutIds.filter((wid) => wid !== id),
              })),
              workouts,
            };
          }),
        ),

      setPreferences: (patch) =>
        set((s) => ({ preferences: { ...s.preferences, ...patch } })),

      exportData: () => {
        const { plans, activePlanId, preferences } = get();
        if (Object.keys(plans).length === 0) return "";
        return serializeExport(plans, activePlanId, preferences);
      },

      importData: (json) => {
        const { plans, activePlanId, preferences } = parseImport(json);
        // Carry over finished sessions by id: an AI-modified import is often
        // built from a stale export, so merge logged workouts from the current
        // plans rather than letting the import overwrite them.
        const prev = get().plans;
        const mergedPlans: Record<string, TrainingPlan> = {};
        for (const [id, p] of Object.entries(plans)) {
          const sourceId = findMatchingPlanId(prev, p);
          const source = sourceId ? prev[sourceId] : null;
          mergedPlans[id] = source ? mergeLoggedWorkouts(p, source) : p;
        }
        set((s) => ({
          plans: mergedPlans,
          activePlanId,
          preferences: preferences
            ? { ...s.preferences, ...preferences }
            : s.preferences,
          lastModified: nowISO(),
        }));
      },

      applyRemote: (json, modifiedTime) => {
        const { plans, activePlanId, preferences } = parseImport(json);
        set((s) => ({
          plans,
          activePlanId,
          preferences: preferences
            ? { ...s.preferences, ...preferences }
            : s.preferences,
          lastModified: modifiedTime,
        }));
      },
    }),
    {
      name: STORAGE_KEY,
      // v5: additive — Workout.startTime/weather + Preferences weather flags.
      // v6: rename Workout.finishTime -> startTime (derive start via duration).
      // v7: additive — Workout.splits + Preferences.splitScannerEnabled
      //     (absent = correct default, so no transform needed).
      // v8: additive — Preferences.splitScannerOnboardingSeen. Left unset for
      //     existing users on purpose, so they get the one-time prompt too.
      // v9: additive — Preferences.nextPlanPromptSeen (plan ids already asked).
      // v10: additive — TrainingPlan.isExample, set only on newly seeded demo
      //      plans. Deliberately NOT backfilled: an existing seeded plan may
      //      have been adopted as the user's real training.
      // v11: additive — PlanMeta.raceType/loopKm/targetYards. Absent raceType
      //      means "standard", so existing plans need no backfill.
      //      v11 also adds `preferences.calendarView`; absent means "month",
      //      so it needs no backfill either.
      version: 11,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        plans: state.plans,
        activePlanId: state.activePlanId,
        preferences: state.preferences,
        lastModified: state.lastModified,
      }),
      migrate: (persisted, version) => {
        let state = persisted as Record<string, unknown> | undefined;

        // v0: a single `plan` + race metadata living in `preferences`.
        if (version === 0 && state && state.plan) {
          const p = state.plan as TrainingPlan;
          const prefs = (state.preferences ?? {}) as Record<string, string>;
          const id = p.id ?? newId();
          const plan: TrainingPlan = {
            ...DEFAULT_PLAN_META,
            ...p,
            id,
            name: DEFAULT_PLAN_META.name,
            raceName: prefs.raceName ?? DEFAULT_PLAN_META.raceName,
            raceDate: p.raceDate ?? prefs.raceDate ?? DEFAULT_PLAN_META.raceDate,
            goalPace: prefs.goalPace ?? DEFAULT_PLAN_META.goalPace,
            goalLabel: prefs.goalLabel ?? DEFAULT_PLAN_META.goalLabel,
          };
          state = {
            plans: { [id]: plan },
            activePlanId: id,
            preferences: { theme: (prefs.theme as Preferences["theme"]) ?? "system" },
            lastModified: (state.lastModified as string) ?? nowISO(),
          };
        }

        // Ensure newer per-plan fields exist, without touching workouts:
        //  - v2: `offDays` (primary plan seeds the defaults)
        //  - v3: `raceDistanceKm`
        if (state && state.plans) {
          const plans = { ...(state.plans as Record<string, TrainingPlan>) };
          for (const [key, plan] of Object.entries(plans)) {
            let next = plan;
            if (!Array.isArray(plan.offDays)) {
              const isPrimary =
                plan.id === DEFAULT_PLAN_ID ||
                plan.name === DEFAULT_PLAN_META.name;
              next = { ...next, offDays: isPrimary ? DEFAULT_OFF_DAYS : [] };
            }
            if (typeof plan.raceDistanceKm !== "number") {
              next = { ...next, raceDistanceKm: DEFAULT_PLAN_META.raceDistanceKm };
            }
            plans[key] = next;
          }
          state = { ...state, plans };
        }

        // v4: anyone with persisted data is an existing user — skip onboarding.
        if (state) {
          state = {
            ...state,
            preferences: {
              ...((state.preferences as Record<string, unknown>) ?? {}),
              onboardingSeen: true,
            },
          };
        }

        // v6: rename the old `finishTime` (finish) to `startTime` (start),
        // deriving the start from the finish minus the run's duration.
        if (state && state.plans) {
          const plans = { ...(state.plans as Record<string, TrainingPlan>) };
          for (const [key, plan] of Object.entries(plans)) {
            let touched = false;
            const workouts: Record<string, Workout> = { ...plan.workouts };
            for (const [wid, w] of Object.entries(workouts)) {
              const legacy = w as Workout & { finishTime?: string };
              if (legacy.finishTime === undefined) continue;
              const { finishTime, ...rest } = legacy;
              workouts[wid] = {
                ...rest,
                startTime:
                  rest.startTime ??
                  deriveStartTime(finishTime, rest.durationMin),
              };
              touched = true;
            }
            if (touched) plans[key] = { ...plan, workouts };
          }
          state = { ...state, plans };
        }

        return state;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        state?.initializePlan();
      },
    },
  ),
);
