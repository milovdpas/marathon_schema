"use client";

import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { isPlanFinished } from "@/lib/plan/context";
import type { TrainingPlan } from "@/lib/types";

/**
 * A plan's name plus whatever is worth knowing about it at a glance.
 *
 * "Example" matters most: a demo plan is someone else's training, it is
 * excluded from AI context, and a user who has forgotten which one they're
 * looking at will otherwise read its numbers as their own.
 */
export function PlanOptionLabel({ plan }: { plan: TrainingPlan }) {
  const { t } = useTranslation();

  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="truncate">{plan.name}</span>
      {plan.isExample ? (
        <Badge variant="secondary">{t("common.example")}</Badge>
      ) : null}
      {isPlanFinished(plan) ? (
        <Badge variant="outline">{t("wizard.planFinished")}</Badge>
      ) : null}
    </span>
  );
}
