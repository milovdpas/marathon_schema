"use client";

import { useTranslation } from "react-i18next";
import { AthleteTypePicker } from "@/components/common/athlete-type-picker";
import type { AthleteType } from "@/lib/types";

/**
 * What the athlete trains for. Optional: skipping leaves every feature visible,
 * which is the safe default — hiding things from someone who told us nothing is
 * how an app ends up feeling broken.
 */
export function StepProfile({
  value,
  onChange,
}: {
  value: AthleteType[];
  onChange: (next: AthleteType[]) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <AthleteTypePicker value={value} onChange={onChange} />
      <p className="text-xs text-muted-foreground">{t("welcome.profileHint")}</p>
    </div>
  );
}
