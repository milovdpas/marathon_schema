import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { paceFromDistanceDuration } from "@/lib/pace";
import {
  DEFAULT_OFF_DAYS,
  DEFAULT_PLAN_ID,
  DEFAULT_PLAN_META,
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
  selectPlan: (id: string) => void;
  deletePlan: (id: string) => void;
  updatePlanMeta: (patch: Partial<PlanMeta>) => void;
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
  ) => void;
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
            raceDate: cur.raceDate,
            goalPace: cur.goalPace,
            goalLabel: cur.goalLabel,
            seedRuns: isPrimary ? MILO_SEED_RUNS : undefined,
            // Preserve the user's off days across a regenerate.
            offDays: cur.offDays ?? [],
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

      addWorkout: (input) =>
        set((s) =>
          mutateActive(s, (p) => {
            const idx = weekIndexForDate(p, input.date);
            const week = idx >= 0 ? p.weeks[idx] : undefined;
            const id = newId();
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
        ),

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
        set((s) => ({
          plans,
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
      version: 2,
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

        // v1 → v2: add `offDays` to plans that lack it, without touching
        // workouts. The primary plan gets the default off-periods seeded.
        if (state && state.plans) {
          const plans = { ...(state.plans as Record<string, TrainingPlan>) };
          for (const [key, plan] of Object.entries(plans)) {
            if (!Array.isArray(plan.offDays)) {
              const isPrimary =
                plan.id === DEFAULT_PLAN_ID ||
                plan.name === DEFAULT_PLAN_META.name;
              plans[key] = { ...plan, offDays: isPrimary ? DEFAULT_OFF_DAYS : [] };
            }
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
