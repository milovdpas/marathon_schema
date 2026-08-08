"use client";

import { useTranslation } from "react-i18next";
import { AthleteTypePicker } from "@/components/common/athlete-type-picker";
import { Card } from "@/components/ui/card";
import type { AthleteType } from "@/lib/types";
import { useTrainingStore } from "@/store/use-training-store";

/**
 * What the user trains for, editable.
 *
 * Writes on every toggle rather than behind a save button: an empty selection
 * is a legitimate answer here ("show me everything"), so there is no invalid
 * intermediate state to protect against — and `[]` also happens to be the
 * value that stops the one-time prompt from ever asking again.
 */
export function AthleteCard() {
  const { t } = useTranslation();
  const athleteTypes = useTrainingStore((s) => s.preferences.athleteTypes);
  const setPreferences = useTrainingStore((s) => s.setPreferences);

  const value = athleteTypes ?? [];

  return (
    <Card className="gap-0 p-4">
      <h3 className="mb-1 text-sm font-semibold">{t("athlete.cardTitle")}</h3>
      <p className="mb-3 text-xs text-muted-foreground">
        {t("athlete.cardBody")}
      </p>
      <AthleteTypePicker
        value={value}
        onChange={(next: AthleteType[]) =>
          setPreferences({ athleteTypes: next })
        }
      />
      {value.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("athlete.none")}
        </p>
      ) : null}
    </Card>
  );
}
