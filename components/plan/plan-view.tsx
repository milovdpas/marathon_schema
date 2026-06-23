"use client";

import { ChevronDown, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CompleteWorkoutDialog } from "@/components/common/complete-workout-dialog";
import { FlexibleDayPicker } from "@/components/common/flexible-day-picker";
import { NoPlanState } from "@/components/common/no-plan-state";
import { WorkoutRow } from "@/components/common/workout-row";
import { WorkoutFormDialog } from "@/components/plan/workout-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRange, todayISO } from "@/lib/date";
import { type WeekPhase, type Workout } from "@/lib/types";
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
  const { t } = useTranslation();
  const plan = useActivePlan();
  const toggleComplete = useTrainingStore((s) => s.toggleComplete);
  const updateWorkout = useTrainingStore((s) => s.updateWorkout);

  const today = todayISO();
  const currentWeek = plan?.weeks.find(
    (w) => today >= w.startDate && today <= w.endDate,
  );
  const [open, setOpen] = useState<Set<number>>(
    new Set(currentWeek ? [currentWeek.weekNumber] : [1]),
  );
  const [editing, setEditing] = useState<Workout | null>(null);
  const [adding, setAdding] = useState(false);
  const [completing, setCompleting] = useState<Workout | null>(null);

  if (!plan) return <NoPlanState />;

  // Completing opens the quick-log dialog (prefilled); un-checking just flips it.
  const handleToggle = (id: string) => {
    const w = plan.workouts[id];
    if (!w) return;
    if (w.completed) toggleComplete(id);
    else setCompleting(w);
  };

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
          <Plus className="size-4" /> {t("plan.addWorkout")}
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
                    {t("plan.week", { n: week.weekNumber })}
                  </span>
                  <Badge
                    className={cn(
                      "border-transparent text-[10px]",
                      PHASE_BADGE[week.phase],
                    )}
                  >
                    {t(`phase.${week.phase}`)}
                  </Badge>
                  {week.label ? (
                    <span className="text-xs text-muted-foreground">
                      · {week.label}
                    </span>
                  ) : null}
                  {isCurrent ? (
                    <span className="text-[10px] font-semibold uppercase text-primary">
                      {t("plan.thisWeek")}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("plan.weekMeta", {
                    range: formatRange(week.startDate, week.endDate),
                    km: Math.round(planned),
                    done,
                    total: workouts.length,
                  })}
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
                    {t("plan.restWeek")}
                  </p>
                ) : (
                  workouts.map((w) => {
                    const isFlexible =
                      w.flexible && w.windowStart && w.windowEnd;
                    if (isFlexible) {
                      // Row + day-picker read as one card with an orange tint.
                      return (
                        <div
                          key={w.id}
                          className={cn(
                            "overflow-hidden rounded-xl border bg-card",
                            w.completed
                              ? "border-primary/30 bg-primary/[0.04]"
                              : "border-tempo/40 bg-tempo/[0.05]",
                          )}
                        >
                          <WorkoutRow
                            workout={w}
                            onToggle={handleToggle}
                            onEdit={setEditing}
                            className="rounded-none border-0 bg-transparent"
                          />
                          <div
                            className={cn(
                              "border-t px-3 py-2",
                              w.completed
                                ? "border-primary/20"
                                : "border-tempo/20",
                            )}
                          >
                            <FlexibleDayPicker
                              workout={w}
                              onPick={(iso) =>
                                updateWorkout(w.id, { date: iso })
                              }
                            />
                          </div>
                        </div>
                      );
                    }
                    return (
                      <WorkoutRow
                        key={w.id}
                        workout={w}
                        onToggle={handleToggle}
                        onEdit={setEditing}
                      />
                    );
                  })
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
      <CompleteWorkoutDialog
        workout={completing}
        open={!!completing}
        onOpenChange={(o) => !o && setCompleting(null)}
      />
    </div>
  );
}
