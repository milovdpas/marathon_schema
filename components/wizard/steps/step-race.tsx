"use client";

import { useTranslation } from "react-i18next";
import { Field } from "@/components/common/field";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BACKYARD_LOOP_KM, backyardDistanceKm } from "@/lib/backyard";
import type { Draft } from "@/lib/plan-request";
import { cn } from "@/lib/utils";
import type { SetDraft } from "@/components/wizard/steps/types";

const DISTANCE_PRESETS = [
  { km: 42.2, label: "Marathon" },
  { km: 21.1, label: "½ Marathon" },
  { km: 10, label: "10K" },
  { km: 5, label: "5K" },
];

/** Everything about the race itself: name, format, distance, dates, goal. */
export function StepRace({ draft, set }: { draft: Draft; set: SetDraft }) {
  const { t } = useTranslation();
  const isBackyard = draft.raceType === "backyard";

  return (
    <Card className="gap-0 space-y-3 p-4">
      <Field label={t("wizard.planName")}>
        <Input
          placeholder={t("wizard.planNamePlaceholder")}
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </Field>
      <Field label={t("wizard.raceName")}>
        <Input
          placeholder={t("wizard.raceNamePlaceholder")}
          value={draft.raceName}
          onChange={(e) => set("raceName", e.target.value)}
        />
      </Field>

      {/* Race format decides what the distance and goal fields mean. */}
      <div>
        <Label className="text-xs text-muted-foreground">
          {t("wizard.raceTypeQ")}
        </Label>
        <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
          {(["standard", "backyard"] as const).map((rt) => (
            <button
              key={rt}
              type="button"
              onClick={() => set("raceType", rt)}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                draft.raceType === rt
                  ? "border-primary bg-primary/5"
                  : "hover:bg-accent",
              )}
            >
              <p className="text-sm font-medium">
                {rt === "standard"
                  ? t("wizard.raceTypeStandard")
                  : t("wizard.raceTypeBackyard")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {rt === "standard"
                  ? t("wizard.raceTypeStandardDesc")
                  : t("wizard.raceTypeBackyardDesc")}
              </p>
            </button>
          ))}
        </div>
      </div>

      {isBackyard ? (
        <div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("wizard.loopKm")}>
              <Input
                type="number"
                inputMode="decimal"
                step="0.001"
                value={draft.loopKm}
                onChange={(e) =>
                  set("loopKm", Number(e.target.value) || BACKYARD_LOOP_KM)
                }
              />
            </Field>
            <Field label={t("wizard.targetYards")}>
              <Input
                type="number"
                inputMode="numeric"
                step="1"
                min="1"
                value={draft.targetYards}
                onChange={(e) =>
                  set("targetYards", Math.max(1, Number(e.target.value) || 0))
                }
              />
            </Field>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t("wizard.backyardDerived", {
              hours: draft.targetYards,
              km: backyardDistanceKm(draft.loopKm, draft.targetYards),
            })}
          </p>
        </div>
      ) : (
        <div>
          <Label className="text-xs text-muted-foreground">
            {t("wizard.raceDistance")}
          </Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {DISTANCE_PRESETS.map((p) => (
              <button
                key={p.km}
                type="button"
                onClick={() => set("raceDistanceKm", p.km)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                  draft.raceDistanceKm === p.km
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-accent",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Input
            type="number"
            inputMode="decimal"
            step="0.1"
            className="mt-2"
            aria-label={t("wizard.distanceCustom")}
            value={draft.raceDistanceKm}
            onChange={(e) => set("raceDistanceKm", Number(e.target.value) || 0)}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("wizard.startDate")}>
          <Input
            type="date"
            value={draft.startDate}
            onChange={(e) => set("startDate", e.target.value)}
          />
        </Field>
        <Field label={t("wizard.raceDate")}>
          <Input
            type="date"
            value={draft.raceDate}
            onChange={(e) => set("raceDate", e.target.value)}
          />
        </Field>
      </div>
      <p className="-mt-1 text-xs text-muted-foreground">
        {t("wizard.startDateHint")}
      </p>

      {/* A backyard ultra's goal IS the target yards set above, so the
          finish/time/pace choice doesn't apply. */}
      <div className={cn(isBackyard && "hidden")}>
        <Label className="text-xs text-muted-foreground">
          {t("wizard.goalQ")}
        </Label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {(["finish", "time", "pace"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => set("goalType", g)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                draft.goalType === g
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-accent",
              )}
            >
              {t(
                `wizard.goal${g === "finish" ? "Finish" : g === "time" ? "Time" : "Pace"}`,
              )}
            </button>
          ))}
        </div>
        {draft.goalType !== "finish" ? (
          <Input
            className="mt-2"
            placeholder={
              draft.goalType === "time"
                ? t("wizard.goalTimePlaceholder")
                : t("wizard.goalPacePlaceholder")
            }
            value={draft.goalValue}
            onChange={(e) => set("goalValue", e.target.value)}
          />
        ) : null}
      </div>
    </Card>
  );
}
