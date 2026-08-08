"use client";

import { BarChart3, CalendarDays, ListChecks, Timer } from "lucide-react";
import { useTranslation } from "react-i18next";

const SLIDES = [
  { icon: ListChecks, key: "plan" },
  { icon: CalendarDays, key: "calendar" },
  { icon: Timer, key: "log" },
  { icon: BarChart3, key: "stats" },
] as const;

/** What the app actually does, in four lines. */
export function StepTour() {
  const { t } = useTranslation();

  return (
    <ul className="space-y-3">
      {SLIDES.map(({ icon: Icon, key }) => (
        <li key={key} className="flex gap-3 rounded-xl border p-3">
          <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">{t(`welcome.tour.${key}`)}</p>
            <p className="text-xs text-muted-foreground">
              {t(`welcome.tour.${key}Body`)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
