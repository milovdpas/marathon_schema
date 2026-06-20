"use client";

import { format } from "date-fns";
import { Plus } from "lucide-react";
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
import type { Workout } from "@/lib/types";

export function DayDetailSheet({
  date,
  workouts,
  onOpenChange,
  onToggle,
  onEdit,
  onAdd,
}: {
  date: string | null;
  workouts: Workout[];
  onOpenChange: (open: boolean) => void;
  onToggle: (id: string) => void;
  onEdit: (w: Workout) => void;
  onAdd: (date: string) => void;
}) {
  return (
    <Sheet open={!!date} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-2xl rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>
            {date ? format(fromISO(date), "EEEE d MMMM") : ""}
          </SheetTitle>
          <SheetDescription>
            {workouts.length} workout{workouts.length === 1 ? "" : "s"} scheduled
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-2 overflow-y-auto px-4 pb-4">
          {workouts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nothing scheduled this day.
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
              <Plus className="size-4" /> Add workout
            </Button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
