"use client";

import { Share } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * The iOS route to an installed app. Safari exposes no install API and never
 * has, so these are the manual Share-sheet steps — shared between the Settings
 * card and the one-time prompt so the two can't drift.
 */
export function InstallInstructions() {
  const { t } = useTranslation();

  return (
    <ol className="space-y-1.5 text-xs text-muted-foreground">
      <li className="flex items-center gap-1.5">
        <Share className="size-3.5 shrink-0 text-primary" />
        {t("install.iosStep1")}
      </li>
      <li>{t("install.iosStep2")}</li>
      <li>{t("install.iosStep3")}</li>
    </ol>
  );
}
