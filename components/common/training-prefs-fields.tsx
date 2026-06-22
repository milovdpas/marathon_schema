"use client";

import { addDays, format, startOfWeek } from "date-fns";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getDateLocale } from "@/lib/date-locale";
import type { TrainingPrefs } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TrainingPrefsFields({
  prefs,
  onChange,
}: {
  prefs: TrainingPrefs;
  onChange: (patch: Partial<TrainingPrefs>) => void;
}) {
  const { t, i18n } = useTranslation();

  const weekdayLabels = useMemo(() => {
    const monday = startOfWeek(new Date(2024, 0, 1), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) =>
      format(addDays(monday, i), "EEE", { locale: getDateLocale() }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  const targetUnknown = prefs.targetDistanceKm === null;

  return (
    <div className="space-y-4">
      <div className="grid gap-1.5">
        <Label className="text-xs text-muted-foreground">
          {t("wizard.daysPerWeek")}
        </Label>
        <Input
          type="number"
          min={1}
          max={7}
          value={prefs.daysPerWeek}
          onChange={(e) =>
            onChange({
              daysPerWeek: Math.max(1, Math.min(7, Number(e.target.value) || 1)),
            })
          }
        />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">
          {t("wizard.trainingDaysQ")}
        </Label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {weekdayLabels.map((label, i) => (
            <button
              key={i}
              type="button"
              disabled={prefs.flexibleDays}
              onClick={() =>
                onChange({
                  trainingDays: prefs.trainingDays.map((v, j) =>
                    j === i ? !v : v,
                  ),
                })
              }
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40",
                !prefs.flexibleDays && prefs.trainingDays[i]
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-accent",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="mt-2 flex items-center justify-between rounded-lg border px-3 py-2.5">
          <span className="text-sm">{t("wizard.flexibleDays")}</span>
          <Switch
            checked={prefs.flexibleDays}
            onCheckedChange={(v) => onChange({ flexibleDays: v })}
          />
        </label>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">
          {t("wizard.planningModeQ")}
        </Label>
        <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
          {(["exact", "flexible"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onChange({ planningMode: mode })}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                prefs.planningMode === mode
                  ? "border-primary bg-primary/5"
                  : "hover:bg-accent",
              )}
            >
              <p className="text-sm font-medium">
                {mode === "exact"
                  ? t("wizard.planningExact")
                  : t("wizard.planningFlexible")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {mode === "exact"
                  ? t("wizard.planningExactDesc")
                  : t("wizard.planningFlexibleDesc")}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">
          {t("wizard.targetQ")}
        </Label>
        <label className="mt-1.5 flex items-center justify-between rounded-lg border px-3 py-2.5">
          <span className="text-sm">{t("wizard.targetUnknown")}</span>
          <Switch
            checked={targetUnknown}
            onCheckedChange={(v) =>
              onChange({ targetDistanceKm: v ? null : 30 })
            }
          />
        </label>
        {!targetUnknown ? (
          <div className="mt-2 grid gap-1.5">
            <Label className="text-xs text-muted-foreground">
              {t("wizard.targetKm")}
            </Label>
            <Input
              type="number"
              inputMode="decimal"
              step="1"
              value={prefs.targetDistanceKm ?? ""}
              onChange={(e) =>
                onChange({ targetDistanceKm: Number(e.target.value) || 0 })
              }
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
