import { DEFAULT_PLAN_META, PLAN_VERSION } from "./plan-generator";
import type { Preferences, TrainingPlan } from "./types";

export const STORAGE_KEY = "marathon-training-v1";

export interface ExportBundle {
  app: "marathon-tracker";
  version: number;
  exportedAt: string;
  plans: Record<string, TrainingPlan>;
  activePlanId: string | null;
  preferences: Preferences;
}

/** Serialize the full app state to a pretty JSON string for export. */
export function serializeExport(
  plans: Record<string, TrainingPlan>,
  activePlanId: string | null,
  preferences: Preferences,
): string {
  const bundle: ExportBundle = {
    app: "marathon-tracker",
    version: PLAN_VERSION,
    exportedAt: new Date().toISOString(),
    plans,
    activePlanId,
    preferences,
  };
  return JSON.stringify(bundle, null, 2);
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `plan-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}

/**
 * Best-effort repair of JSON that was pasted from an AI chat. Handles the common
 * copy slips: a wrapping ```json code fence, surrounding prose, a missing
 * leading `{` (the text starts straight at the first key), or a missing
 * trailing `}`. Returns a string to hand to JSON.parse.
 */
export function sanitizeImportJson(raw: string): string {
  let s = raw.trim();

  // Unwrap a ```json … ``` (or plain ``` … ```) code fence.
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) s = fence[1].trim();

  if (/^"[\w-]+"\s*:/.test(s)) {
    // Classic slip: the opening "{" was left out, so it starts at the first key
    // (e.g. `"plans": { … }`). Put the brace back.
    s = `{${s}`;
  } else {
    // Otherwise strip any prose/markers around the JSON object payload.
    const first = s.indexOf("{");
    const last = s.lastIndexOf("}");
    if (first >= 0 && last >= first) s = s.slice(first, last + 1);
    else if (first >= 0) s = s.slice(first);
  }

  // Re-balance a missing trailing "}" (the mirror of the slip above).
  const opens = (s.match(/{/g) ?? []).length;
  const closes = (s.match(/}/g) ?? []).length;
  if (opens > closes) s += "}".repeat(opens - closes);

  return s;
}

function isValidPlanShape(p: unknown): p is TrainingPlan {
  const plan = p as TrainingPlan;
  return (
    !!plan &&
    Array.isArray(plan.weeks) &&
    typeof plan.workouts === "object" &&
    plan.workouts != null
  );
}

/** Ensure a raw plan object has all required PlanMeta + id fields. */
function normalizePlan(
  raw: TrainingPlan,
  fallbackMeta?: Partial<TrainingPlan>,
): TrainingPlan {
  return {
    ...DEFAULT_PLAN_META,
    ...fallbackMeta,
    ...raw,
    // Explicit fields win, recovering any missing meta from fallback/defaults.
    id: raw.id ?? fallbackMeta?.id ?? newId(),
    name: raw.name ?? fallbackMeta?.name ?? DEFAULT_PLAN_META.name,
    raceName: raw.raceName ?? fallbackMeta?.raceName ?? DEFAULT_PLAN_META.raceName,
    raceDistanceKm:
      typeof raw.raceDistanceKm === "number"
        ? raw.raceDistanceKm
        : DEFAULT_PLAN_META.raceDistanceKm,
    raceDate: raw.raceDate ?? fallbackMeta?.raceDate ?? DEFAULT_PLAN_META.raceDate,
    startDate: raw.startDate ?? raw.weeks?.[0]?.startDate,
    goalPace: raw.goalPace ?? fallbackMeta?.goalPace ?? DEFAULT_PLAN_META.goalPace,
    goalLabel:
      raw.goalLabel ?? fallbackMeta?.goalLabel ?? DEFAULT_PLAN_META.goalLabel,
    version: raw.version ?? PLAN_VERSION,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    offDays: Array.isArray(raw.offDays) ? raw.offDays : [],
  };
}

/**
 * Parse + validate an exported bundle into the multi-plan shape. Accepts:
 *  - a new bundle ({ plans, activePlanId, preferences }),
 *  - a legacy single-plan bundle ({ plan, preferences }), or
 *  - a bare plan object ({ weeks, workouts, ... }).
 * Throws on malformed input.
 */
export function parseImport(json: string): {
  plans: Record<string, TrainingPlan>;
  activePlanId: string | null;
  preferences?: Preferences;
} {
  let data;
  try {
    data = JSON.parse(sanitizeImportJson(json));
  } catch {
    throw new Error(
      "That doesn't look like valid JSON — it may have been copied incompletely. Copy the AI's whole response (including the first { and last }), or use Attach file.",
    );
  }

  // New multi-plan bundle.
  if (data?.plans && typeof data.plans === "object") {
    const plans: Record<string, TrainingPlan> = {};
    for (const [key, raw] of Object.entries(data.plans)) {
      if (!isValidPlanShape(raw)) {
        throw new Error("Invalid file: a plan is missing `weeks`/`workouts`.");
      }
      const plan = normalizePlan(raw as TrainingPlan, { id: key });
      plans[plan.id] = plan;
    }
    const ids = Object.keys(plans);
    if (ids.length === 0) throw new Error("Invalid file: no plans found.");
    const activePlanId =
      data.activePlanId && plans[data.activePlanId] ? data.activePlanId : ids[0];
    return { plans, activePlanId, preferences: data.preferences };
  }

  // Legacy single-plan bundle, or a bare plan object.
  const rawPlan: TrainingPlan = data?.plan ?? data;
  if (!isValidPlanShape(rawPlan)) {
    throw new Error(
      "Invalid file: expected plans, or a plan with `weeks` and `workouts`.",
    );
  }
  // Legacy preferences carried the race meta — fold it into the plan.
  const legacyPrefs = data?.preferences ?? {};
  const plan = normalizePlan(rawPlan, {
    name: legacyPrefs.raceName ?? rawPlan.raceName,
    raceName: legacyPrefs.raceName,
    raceDate: legacyPrefs.raceDate ?? rawPlan.raceDate,
    goalPace: legacyPrefs.goalPace,
    goalLabel: legacyPrefs.goalLabel,
  });
  const preferences: Preferences | undefined = legacyPrefs.theme
    ? { theme: legacyPrefs.theme }
    : undefined;
  return { plans: { [plan.id]: plan }, activePlanId: plan.id, preferences };
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
