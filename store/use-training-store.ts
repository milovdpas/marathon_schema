import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { paceFromDistanceDuration } from "@/lib/pace";
import { generateDefaultPlan, RACE_DATE } from "@/lib/plan-generator";
import { migratePlan, parseImport, serializeExport, STORAGE_KEY } from "@/lib/storage";
import type { Preferences, TrainingPlan, Workout } from "@/lib/types";

const DEFAULT_PREFERENCES: Preferences = {
  theme: "system",
  raceName: "Marathon",
  raceDate: RACE_DATE,
  goalPace: "4:58",
  goalLabel: "Sub-3:30",
};

interface TrainingState {
  plan: TrainingPlan | null;
  preferences: Preferences;
  hydrated: boolean;
  /** ISO timestamp of the last local mutation — used for sync conflict resolution. */
  lastModified: string;

  setHydrated: (v: boolean) => void;
  initializePlan: () => void;
  regeneratePlan: () => void;

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
  /** Apply a remote bundle from cloud sync without re-stamping local time. */
  applyRemote: (json: string, modifiedTime: string) => void;
}

const nowISO = () => new Date().toISOString();

/** Find the week (by date range) that a given ISO date belongs to. */
function weekIndexForDate(plan: TrainingPlan, date: string): number {
  return plan.weeks.findIndex((w) => date >= w.startDate && date <= w.endDate);
}

export const useTrainingStore = create<TrainingState>()(
  persist(
    (set, get) => ({
      plan: null,
      preferences: DEFAULT_PREFERENCES,
      hydrated: false,
      lastModified: "",

      setHydrated: (v) => set({ hydrated: v }),

      initializePlan: () => {
        if (get().plan) return;
        set({
          plan: generateDefaultPlan(get().preferences.raceDate),
          lastModified: nowISO(),
        });
      },

      regeneratePlan: () =>
        set({
          plan: generateDefaultPlan(get().preferences.raceDate),
          lastModified: nowISO(),
        }),

      toggleComplete: (id) => {
        const plan = get().plan;
        if (!plan) return;
        const w = plan.workouts[id];
        if (!w) return;
        set({
          plan: {
            ...plan,
            workouts: {
              ...plan.workouts,
              [id]: { ...w, completed: !w.completed },
            },
          },
          lastModified: nowISO(),
        });
      },

      updateWorkout: (id, patch) => {
        const plan = get().plan;
        if (!plan) return;
        const existing = plan.workouts[id];
        if (!existing) return;
        const merged: Workout = { ...existing, ...patch };
        // Auto-derive actual pace from distance + duration unless one was set.
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
        set({
          plan: {
            ...plan,
            workouts: { ...plan.workouts, [id]: merged },
          },
          lastModified: nowISO(),
        });
      },

      addWorkout: (input) => {
        const plan = get().plan;
        if (!plan) return;
        const idx = weekIndexForDate(plan, input.date);
        const week = idx >= 0 ? plan.weeks[idx] : undefined;
        const id =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${input.date}-${input.type}-${Object.keys(plan.workouts).length}`;
        const workout: Workout = {
          ...input,
          id,
          weekNumber: week?.weekNumber ?? 0,
          completed: input.completed ?? false,
          isCustom: true,
        };
        const weeks =
          idx >= 0
            ? plan.weeks.map((w, i) =>
                i === idx
                  ? { ...w, workoutIds: [...w.workoutIds, id] }
                  : w,
              )
            : plan.weeks;
        set({
          plan: {
            ...plan,
            weeks,
            workouts: { ...plan.workouts, [id]: workout },
          },
          lastModified: nowISO(),
        });
      },

      deleteWorkout: (id) => {
        const plan = get().plan;
        if (!plan) return;
        const rest = { ...plan.workouts };
        delete rest[id];
        set({
          plan: {
            ...plan,
            weeks: plan.weeks.map((w) => ({
              ...w,
              workoutIds: w.workoutIds.filter((wid) => wid !== id),
            })),
            workouts: rest,
          },
          lastModified: nowISO(),
        });
      },

      setPreferences: (patch) =>
        set({
          preferences: { ...get().preferences, ...patch },
          lastModified: nowISO(),
        }),

      exportData: () => {
        const { plan, preferences } = get();
        if (!plan) return "";
        return serializeExport(plan, preferences);
      },

      importData: (json) => {
        const { plan, preferences } = parseImport(json);
        set({
          plan: migratePlan(plan),
          ...(preferences ? { preferences } : {}),
          lastModified: nowISO(),
        });
      },

      applyRemote: (json, modifiedTime) => {
        const { plan, preferences } = parseImport(json);
        // Stamp with the remote's time (not now) so we don't immediately
        // consider local "newer" and push it straight back.
        set({
          plan: migratePlan(plan),
          ...(preferences ? { preferences } : {}),
          lastModified: modifiedTime,
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        plan: state.plan,
        preferences: state.preferences,
        lastModified: state.lastModified,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        state?.initializePlan();
      },
    },
  ),
);
