"use client";

import { ChevronDown, Plus } from "lucide-react";
import { useState } from "react";
import { WorkoutRow } from "@/components/common/workout-row";
import { WorkoutFormDialog } from "@/components/plan/workout-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRange, todayISO } from "@/lib/date";
import { PHASE_LABELS, type WeekPhase, type Workout } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useActivePlan } from "@/hooks/use-active-plan";
import { useTrainingStore } from "@/store/use-training-store";

const PHASE_BADGE: Record<WeekPhase, string> = {
  base: "bg-muted text-muted-foreground",
  build: "bg-long/15 text-long",
  peak: "bg-primary/15 text-primary",
  taper: "bg-tempo/15 text-tempo",
  race: "bg-primary text-primary-foreground",
  reduced: "bg-recovery/15 text-recovery",
};

export function PlanView() {
  const plan = useActivePlan();
  const toggleComplete = useTrainingStore((s) => s.toggleComplete);

  const today = todayISO();
  const currentWeek = plan?.weeks.find(
    (w) => today >= w.startDate && today <= w.endDate,
  );
  const [open, setOpen] = useState<Set<number>>(
    new Set(currentWeek ? [currentWeek.weekNumber] : [1]),
  );
  const [editing, setEditing] = useState<Workout | null>(null);
  const [adding, setAdding] = useState(false);

  if (!plan) return null;

  const toggleWeek = (n: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus className="size-4" /> Add workout
        </Button>
      </div>

      {plan.weeks.map((week) => {
        const workouts = (
          week.workoutIds.map((id) => plan.workouts[id]).filter(Boolean) as Workout[]
        ).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
        const planned = workouts.reduce((s, w) => s + w.plannedDistanceKm, 0);
        const done = workouts.filter((w) => w.completed).length;
        const isOpen = open.has(week.weekNumber);
        const isCurrent = week.weekNumber === currentWeek?.weekNumber;

        return (
          <div
            key={week.weekNumber}
            className={cn(
              "overflow-hidden rounded-xl border bg-card",
              isCurrent && "ring-1 ring-primary/40",
            )}
          >
            <button
              type="button"
              onClick={() => toggleWeek(week.weekNumber)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">
                    Week {week.weekNumber}
                  </span>
                  <Badge
                    className={cn(
                      "border-transparent text-[10px]",
                      PHASE_BADGE[week.phase],
                    )}
                  >
                    {PHASE_LABELS[week.phase]}
                  </Badge>
                  {week.label ? (
                    <span className="text-xs text-muted-foreground">
                      · {week.label}
                    </span>
                  ) : null}
                  {isCurrent ? (
                    <span className="text-[10px] font-semibold uppercase text-primary">
                      this week
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatRange(week.startDate, week.endDate)} ·{" "}
                  {Math.round(planned)} km · {done}/{workouts.length} done
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "size-5 shrink-0 text-muted-foreground transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            </button>

            {isOpen ? (
              <div className="space-y-2 border-t bg-muted/30 p-3">
                {workouts.length === 0 ? (
                  <p className="px-1 py-2 text-sm text-muted-foreground">
                    Rest week — no scheduled runs.
                  </p>
                ) : (
                  workouts.map((w) => (
                    <WorkoutRow
                      key={w.id}
                      workout={w}
                      onToggle={toggleComplete}
                      onEdit={setEditing}
                    />
                  ))
                )}
              </div>
            ) : null}
          </div>
        );
      })}

      <WorkoutFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        workout={editing}
      />
      <WorkoutFormDialog
        open={adding}
        onOpenChange={setAdding}
        defaultDate={today}
      />
    </div>
  );
}
