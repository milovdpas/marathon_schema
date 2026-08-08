"use client";

import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  athleteTypesWithoutExample,
  EXAMPLE_PLANS,
  examplesFor,
} from "@/lib/plan/examples";
import { useTrainingStore } from "@/store/use-training-store";

/**
 * The demo plans, offered by what the user says they train for.
 *
 * The "show all sports" escape hatch is not decoration: capability filtering
 * would otherwise trap someone who took up trail running and never went back to
 * update their profile, and a filter with no way past it reads as a bug.
 */
export function ExamplePlansCard() {
  const { t } = useTranslation();
  const athleteTypes = useTrainingStore((s) => s.preferences.athleteTypes);
  const plans = useTrainingStore((s) => s.plans);
  const addExamplePlan = useTrainingStore((s) => s.addExamplePlan);

  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const matching = examplesFor(athleteTypes);
  const entries = showAll || matching.length === 0 ? EXAMPLE_PLANS : matching;
  // Bike and swim have no demo until `Workout.sport` exists, so adding
  // "cyclist" to your profile currently changes nothing here. Say that, rather
  // than leaving the list looking broken.
  const pending = athleteTypesWithoutExample(athleteTypes);

  return (
    <Card className="gap-0 p-4">
      <h3 className="mb-1 text-sm font-semibold">{t("examples.addTitle")}</h3>
      <p className="mb-3 text-xs text-muted-foreground">
        {t("examples.addBody")}
      </p>

      <ul className="space-y-2">
        {entries.map((entry) => {
          const added = Boolean(plans[entry.id]);
          return (
            <li
              key={entry.key}
              className="flex items-center gap-3 rounded-xl border p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {t(entry.labelKey)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(entry.descriptionKey)}
                </p>
              </div>
              {added ? (
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Check className="size-3.5" /> {t("examples.added")}
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy !== null}
                  onClick={() => {
                    setBusy(entry.key);
                    void addExamplePlan(entry.key).finally(() =>
                      setBusy(null),
                    );
                  }}
                >
                  <Plus className="size-4" /> {t("common.add")}
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {pending.length > 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("examples.comingSoon", {
            sports: pending.map((tt) => t(`athlete.${tt}`)).join(", "),
          })}
        </p>
      ) : null}

      {!showAll && matching.length > 0 && matching.length < EXAMPLE_PLANS.length ? (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 self-start"
          onClick={() => setShowAll(true)}
        >
          {t("examples.showAll")}
        </Button>
      ) : null}
    </Card>
  );
}
