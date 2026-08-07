"use client";

import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CalendarViewMode } from "@/lib/types";

/**
 * The Month/Week/Day/Agenda picker. Stays put while you scroll, parked under
 * the mobile top bar — `--h-topbar` is 0 on md+ where that bar doesn't exist,
 * so no `md:` variant is needed. Negative margins let its background span the
 * full width against `main`'s px-4 / md:px-8.
 */
export function CalendarViewTabs({
  value,
  onChange,
}: {
  value: CalendarViewMode;
  onChange: (v: CalendarViewMode) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-(--stick-viewbar) z-(--z-sticky) -mx-4 flex h-(--h-viewbar) items-center bg-background px-4 md:-mx-8 md:px-8">
      <Tabs
        value={value}
        onValueChange={(v) => onChange(v as CalendarViewMode)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="month">{t("calendar.viewMonth")}</TabsTrigger>
          <TabsTrigger value="week">{t("calendar.viewWeek")}</TabsTrigger>
          <TabsTrigger value="day">{t("calendar.viewDay")}</TabsTrigger>
          <TabsTrigger value="agenda">{t("calendar.viewAgenda")}</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
