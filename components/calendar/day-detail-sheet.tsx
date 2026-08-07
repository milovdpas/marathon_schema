"use client";

import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import {
  DayDetail,
  dayItems,
  type DayDetailProps,
} from "@/components/calendar/day-detail";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fromISO } from "@/lib/date";
import { getDateLocale } from "@/lib/date-locale";

/** Tap-a-date peek. The body is `DayDetail`, shared with the full Day view. */
export function DayDetailSheet({
  onOpenChange,
  ...detail
}: DayDetailProps & { onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation();
  const { date, workouts, flexibleInWindow } = detail;
  const count = dayItems(workouts, flexibleInWindow).length;

  return (
    <Sheet open={!!date} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-2xl rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>
            {date
              ? format(fromISO(date), "EEEE d MMMM", { locale: getDateLocale() })
              : ""}
          </SheetTitle>
          <SheetDescription>
            {t("calendar.workoutsScheduled", { count })}
          </SheetDescription>
        </SheetHeader>
        <DayDetail {...detail} className="overflow-y-auto px-4 pb-4" />
      </SheetContent>
    </Sheet>
  );
}
