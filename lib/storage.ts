import { PLAN_VERSION } from "./plan-generator";
import type { Preferences, TrainingPlan } from "./types";

export const STORAGE_KEY = "marathon-training-v1";

export interface ExportBundle {
  app: "marathon-tracker";
  version: number;
  exportedAt: string;
  plan: TrainingPlan;
  preferences: Preferences;
}

/** Serialize the full app state to a pretty JSON string for export. */
export function serializeExport(
  plan: TrainingPlan,
  preferences: Preferences,
): string {
  const bundle: ExportBundle = {
    app: "marathon-tracker",
    version: PLAN_VERSION,
    exportedAt: new Date().toISOString(),
    plan,
    preferences,
  };
  return JSON.stringify(bundle, null, 2);
}

/** Parse + validate an exported bundle. Throws on malformed input. */
export function parseImport(json: string): {
  plan: TrainingPlan;
  preferences?: Preferences;
} {
  const data = JSON.parse(json);
  // Accept either a full bundle or a bare plan object.
  const plan: TrainingPlan = data.plan ?? data;
  if (
    !plan ||
    !Array.isArray(plan.weeks) ||
    typeof plan.workouts !== "object" ||
    plan.workouts == null
  ) {
    throw new Error(
      "Invalid file: expected a plan with `weeks` and `workouts`.",
    );
  }
  return { plan, preferences: data.preferences };
}

/** Trigger a browser download of the export bundle. */
export function downloadJSON(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Migrate a persisted plan from an older schema version. No-op today; this is
 * the single place to add field migrations as the schema evolves.
 */
export function migratePlan(plan: TrainingPlan): TrainingPlan {
  // Example pattern for future versions:
  // if (plan.version < 2) { ...transform...; plan.version = 2; }
  return plan;
}
