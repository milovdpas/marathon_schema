"use client";

import { Compass, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

/** The two ways out of the flow, explained before they're clicked. */
export function StepFinish() {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="flex gap-3 rounded-xl border p-3">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-medium">{t("welcome.finish.create")}</p>
          <p className="text-xs text-muted-foreground">
            {t("welcome.finish.createBody")}
          </p>
        </div>
      </div>
      <div className="flex gap-3 rounded-xl border p-3">
        <Compass className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-medium">{t("welcome.finish.explore")}</p>
          <p className="text-xs text-muted-foreground">
            {t("welcome.finish.exploreBody")}
          </p>
        </div>
      </div>
    </div>
  );
}
