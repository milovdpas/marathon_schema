import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { paceFromDistanceDuration } from "@/lib/pace";
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
    trainingPrefs?: TrainingPrefs,
    startDate?: string,
  ) => void;
  selectPlan: (id: string) => void;
  deletePlan: (id: string) => void;
  updatePlanMeta: (patch: Partial<PlanMeta>) => void;
  updateTrainingPrefs: (patch: Partial<TrainingPrefs>) => void;
  regenerateActivePlan: () => void;

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

      addPlanFromImport: (json, trainingPrefs, startDate) => {
        const { plans: imported } = parseImport(json);
        const entries = Object.values(imported);
        if (entries.length === 0) throw new Error("No plan found in file.");
        const existing = get().plans;
        const next = { ...existing };
        let activeId = get().activePlanId;
        for (const p of entries) {
          // If this import updates a plan we already have (shared workout ids),
          // replace it in place and carry over completed sessions — so a "behind"
          // AI plan never wipes finished workouts, and stats aren't double-counted.
          const targetId = findMatchingPlanId(existing, p);
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
            const def = generateDefaultPlan();
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

      regenerateActivePlan: () =>
        set((s) => {
          const id = s.activePlanId;
          const cur = id ? s.plans[id] : null;
          if (!id || !cur) return {};
          // Re-seed history only for the primary plan.
          const isPrimary =
            cur.id === DEFAULT_PLAN_ID || cur.name === DEFAULT_PLAN_META.name;
          const fresh = generateDefaultPlan({
            id: cur.id,
            name: cur.name,
            raceName: cur.raceName,
            raceDistanceKm: cur.raceDistanceKm,
            raceDate: cur.raceDate,
            startDate: cur.startDate,
            goalPace: cur.goalPace,
            goalLabel: cur.goalLabel,
            seedRuns: isPrimary ? MILO_SEED_RUNS : undefined,
            // Regenerate restores defaults: the primary plan gets the default
            // off days back; other plans keep whatever they had.
            offDays: isPrimary ? DEFAULT_OFF_DAYS : (cur.offDays ?? []),
            trainingPrefs: cur.trainingPrefs,
            // Anchor to the plan's start so already-elapsed weeks are
            // reproduced rather than dropped, with a stable creation timestamp.
            planStart: cur.startDate ?? cur.createdAt,
            createdAt: cur.createdAt,
          });
          return { plans: { ...s.plans, [id]: fresh }, lastModified: nowISO() };
        }),

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
      // v5: additive — Workout.finishTime/weather + Preferences weather flags.
      // No transform needed (absent = correct default); the migrate below is
      // idempotent and runs for all prior versions.
      version: 5,
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

        return state;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        state?.initializePlan();
      },
    },
  ),
);
