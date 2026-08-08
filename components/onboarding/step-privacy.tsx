"use client";

import { Cloud, HardDrive, Heart, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

const POINTS = [
  { icon: Heart, key: "free" },
  { icon: HardDrive, key: "local" },
  { icon: Cloud, key: "drive" },
  { icon: ShieldCheck, key: "noTracking" },
] as const;

/**
 * The first thing a new visitor sees, deliberately: what happens to their data.
 * Everything else in the flow asks them for something, so the promise comes
 * before the first ask, not after it.
 */
export function StepPrivacy() {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {POINTS.map(({ icon: Icon, key }) => (
        <div key={key} className="flex gap-3 rounded-xl border p-3">
          <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">{t(`welcome.privacy.${key}`)}</p>
            <p className="text-xs text-muted-foreground">
              {t(`welcome.privacy.${key}Body`)}
            </p>
          </div>
        </div>
      ))}

      <p className="pt-1 text-xs text-muted-foreground">
        <Link href="/privacy" className="underline underline-offset-2">
          {t("welcome.privacy.readMore")}
        </Link>
      </p>
    </div>
  );
}
