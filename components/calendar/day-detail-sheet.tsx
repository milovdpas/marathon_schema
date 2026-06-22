"use client";

import { format } from "date-fns";
import { Plus, Umbrella } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FlexibleDayPicker } from "@/components/common/flexible-day-picker";
import { WorkoutRow } from "@/components/common/workout-row";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fromISO } from "@/lib/date";
import { getDateLocale } from "@/lib/date-locale";
import type { OffDay, Workout } from "@/lib/types";

export function DayDetailSheet({
  date,
  workouts,
  flexibleInWindow = [],
  offDay,
  onOpenChange,
  onToggle,
  onEdit,
  onAdd,
  onReschedule,
}: {
  date: string | null;
  workouts: Workout[];
  flexibleInWindow?: Workout[];
  offDay?: OffDay;
  onOpenChange: (open: boolean) => void;
  onToggle: (id: string) => void;
  onEdit: (w: Workout) => void;
  onAdd: (date: string) => void;
  onReschedule: (id: string, date: string) => void;
}) {
  const { t } = useTranslation();
  // Workouts scheduled today + flexible ones whose window covers today.
  const items = [
    ...workouts,
    ...flexibleInWindow.filter((w) => !workouts.some((x) => x.id === w.id)),
  ];
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
            {t("calendar.workoutsScheduled", { count: items.length })}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-2 overflow-y-auto px-4 pb-4">
          {offDay ? (
            <div className="flex items-start gap-2 rounded-lg border border-tempo/30 bg-tempo/10 px-3 py-2">
              <Umbrella className="mt-0.5 size-4 shrink-0 text-tempo" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{offDay.title}</p>
                {offDay.note ? (
                  <p className="text-xs text-muted-foreground">{offDay.note}</p>
                ) : null}
              </div>
            </div>
          ) : null}
          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("calendar.nothingScheduled")}
            </p>
          ) : (
            items.map((w) => (
              <div key={w.id} className="space-y-1.5">
                <WorkoutRow
                  workout={w}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  showDate={false}
                />
                {w.flexible ? (
                  <FlexibleDayPicker
                    workout={w}
                    onPick={(d) => onReschedule(w.id, d)}
                  />
                ) : null}
              </div>
            ))
          )}
          {date ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onAdd(date)}
            >
              <Plus className="size-4" /> {t("calendar.addWorkout")}
            </Button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
