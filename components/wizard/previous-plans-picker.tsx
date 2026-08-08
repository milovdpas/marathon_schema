"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDayLabel } from "@/lib/date";
import { raceSizeLabel } from "@/lib/plan/backyard";
import { canBeContext, isPlanFinished } from "@/lib/plan/context";
import { overallStats } from "@/lib/plan/stats";
import type { TrainingPlan } from "@/lib/types";
import { cn } from "@/lib/utils";

const COLLAPSED = 4;

/**
 * Pick previous plans to hand the AI as training history. Plans with nothing
 * logged are disabled — they'd contribute an empty run list and no signal.
 */
export function PreviousPlansPicker({
  plans,
  selectedIds,
  onChange,
}: {
  plans: TrainingPlan[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  // Only plans with real training in them; the demo plan and untouched plans
  // are filtered out entirely rather than shown greyed-out.
  const eligible = plans.filter(canBeContext);

  // Nothing to attach yet (the common first-run case) — render nothing at all
  // rather than an empty box that looks broken.
  if (eligible.length === 0) return null;

  const shown = expanded ? eligible : eligible.slice(0, COLLAPSED);

  const toggle = (id: string) =>
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );

  return (
    <div>
      <Label>{t("wizard.previousPlans")}</Label>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {t("wizard.previousPlansHint")}
      </p>

      <div className="mt-2 space-y-1.5">
        {shown.map((p) => {
          const stats = overallStats(p);
          const selected = selectedIds.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              role="checkbox"
              aria-checked={selected}
              onClick={() => toggle(p.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                selected ? "border-primary bg-primary/10" : "hover:bg-accent",
              )}
            >
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/40 text-transparent",
                )}
              >
                <Check className="size-3" strokeWidth={3} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{p.name}</span>
                  <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {isPlanFinished(p)
                      ? t("wizard.planFinished")
                      : t("wizard.planInProgress")}
                  </span>
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {p.raceName} · {raceSizeLabel(p)} · {formatDayLabel(p.raceDate)}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {t("wizard.planRuns", {
                    runs: stats.completedCount,
                    km: stats.totalKm,
                  })}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {eligible.length > COLLAPSED ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 text-xs font-medium text-primary hover:underline"
        >
          {expanded
            ? t("wizard.showLess")
            : t("wizard.showAllPlans", { count: eligible.length })}
        </button>
      ) : null}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-xs text-muted-foreground">{children}</span>;
}
