"use client";

import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  athleteTypesWithoutExample,
  examplesFor,
} from "@/lib/plan/examples";
import { useTrainingStore } from "@/store/use-training-store";

/** How many to show before collapsing the rest. */
const VISIBLE = 3;

/**
 * The demo plans for the sports this athlete actually does.
 *
 * There is deliberately **no way to reach another sport's plans from here**.
 * The lever for that is "Your sports" directly above: adding cycling there is
 * both the honest way to say "I cycle" and what makes a cycling demo appear.
 * A second, sport-specific escape hatch in this card would be a quieter way of
 * doing the same thing, and would leave the two controls disagreeing.
 *
 * The "show all" button is only about length: pick every sport and there are
 * seven demos, which buries everything below it.
 */
export function ExamplePlansCard() {
  const { t } = useTranslation();
  const athleteTypes = useTrainingStore((s) => s.preferences.athleteTypes);
  const plans = useTrainingStore((s) => s.plans);
  const addExamplePlan = useTrainingStore((s) => s.addExamplePlan);

  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const matching = examplesFor(athleteTypes);
  const entries = showAll ? matching : matching.slice(0, VISIBLE);
  const hidden = matching.length - entries.length;

  // Empty when an athlete type has been added before its demo exists.
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
                    void addExamplePlan(entry.key).finally(() => setBusy(null));
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

      {hidden > 0 || showAll ? (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 self-start"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? t("examples.showFewer") : t("examples.showAll", { count: hidden })}
        </Button>
      ) : null}
    </Card>
  );
}
