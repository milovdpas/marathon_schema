"use client";

import { format } from "date-fns";
import { Plus, Umbrella } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  offDay,
  onOpenChange,
  onToggle,
  onEdit,
  onAdd,
}: {
  date: string | null;
  workouts: Workout[];
  offDay?: OffDay;
  onOpenChange: (open: boolean) => void;
  onToggle: (id: string) => void;
  onEdit: (w: Workout) => void;
  onAdd: (date: string) => void;
}) {
  const { t } = useTranslation();
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
            {t("calendar.workoutsScheduled", { count: workouts.length })}
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
          {workouts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("calendar.nothingScheduled")}
            </p>
          ) : (
            workouts.map((w) => (
              <WorkoutRow
                key={w.id}
                workout={w}
                onToggle={onToggle}
                onEdit={onEdit}
                showDate={false}
              />
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
