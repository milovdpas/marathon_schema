"use client";

import { useTranslation } from "react-i18next";
import { Field } from "@/components/common/field";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useActivePlan } from "@/hooks/use-active-plan";
import {
  BACKYARD_LOOP_KM,
  backyardDistanceKm,
  isBackyard,
} from "@/lib/plan/backyard";
import { useTrainingStore } from "@/store/use-training-store";

/** Edit the active plan's race metadata. The schedule itself isn't touched. */
export function RaceDetailsCard() {
  const { t } = useTranslation();
  const plan = useActivePlan();
  const updatePlanMeta = useTrainingStore((s) => s.updatePlanMeta);

  if (!plan) return null;

  return (
    <Card className="gap-0 p-4">
      <h3 className="mb-3 text-sm font-semibold">{t("settings.raceDetails")}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("settings.planName")}>
          <Input
            value={plan.name}
            onChange={(e) => updatePlanMeta({ name: e.target.value })}
          />
        </Field>
        <Field label={t("settings.raceName")}>
          <Input
            value={plan.raceName}
            onChange={(e) => updatePlanMeta({ raceName: e.target.value })}
          />
        </Field>

        {isBackyard(plan) ? (
          <BackyardRaceFields
            loopKm={plan.loopKm ?? BACKYARD_LOOP_KM}
            targetYards={plan.targetYards ?? 0}
            onChange={(loopKm, targetYards) =>
              updatePlanMeta({
                loopKm,
                targetYards,
                // raceDistanceKm stays derived so every stat and chart
                // downstream keeps working without knowing about yards.
                raceDistanceKm: backyardDistanceKm(loopKm, targetYards),
              })
            }
          />
        ) : (
          <Field label={t("settings.raceDistance")}>
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={plan.raceDistanceKm}
              onChange={(e) =>
                updatePlanMeta({ raceDistanceKm: Number(e.target.value) || 0 })
              }
            />
          </Field>
        )}

        <Field label={t("settings.startDate")}>
          <Input
            type="date"
            value={plan.startDate ?? ""}
            onChange={(e) => updatePlanMeta({ startDate: e.target.value })}
          />
        </Field>
        <Field label={t("settings.raceDate")}>
          <Input
            type="date"
            value={plan.raceDate}
            onChange={(e) => updatePlanMeta({ raceDate: e.target.value })}
          />
        </Field>
        <Field label={t("settings.goalLabel")}>
          <Input
            value={plan.goalLabel}
            onChange={(e) => updatePlanMeta({ goalLabel: e.target.value })}
          />
        </Field>
        <Field label={t("settings.goalPace")}>
          <Input
            value={plan.goalPace}
            onChange={(e) => updatePlanMeta({ goalPace: e.target.value })}
          />
        </Field>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {t("settings.raceDateNote")}
      </p>
    </Card>
  );
}

/**
 * Loop distance + target yards, with the total they imply. Rendered as a
 * fragment so it drops straight into the parent's two-column grid.
 */
function BackyardRaceFields({
  loopKm,
  targetYards,
  onChange,
}: {
  loopKm: number;
  targetYards: number;
  onChange: (loopKm: number, targetYards: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <Field label={t("wizard.loopKm")}>
        <Input
          type="number"
          inputMode="decimal"
          step="0.001"
          value={loopKm}
          onChange={(e) => onChange(Number(e.target.value) || 0, targetYards)}
        />
      </Field>
      <Field label={t("wizard.targetYards")}>
        <Input
          type="number"
          inputMode="numeric"
          step="1"
          min="1"
          value={targetYards}
          onChange={(e) => onChange(loopKm, Number(e.target.value) || 0)}
        />
      </Field>
      <p className="text-xs text-muted-foreground sm:col-span-2">
        {t("wizard.backyardDerived", {
          hours: targetYards,
          km: backyardDistanceKm(loopKm, targetYards),
        })}
      </p>
    </>
  );
}
