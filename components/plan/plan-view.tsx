"use client";

import { eachDayOfInterval, format } from "date-fns";
import { ChevronDown, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NoPlanState } from "@/components/common/no-plan-state";
import { WorkoutRow } from "@/components/common/workout-row";
import { WorkoutFormDialog } from "@/components/plan/workout-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRange, fromISO, toISO, todayISO } from "@/lib/date";
import { getDateLocale } from "@/lib/date-locale";
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

  if (!plan) return <NoPlanState />;

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
                  workouts.map((w) => (
                    <div key={w.id} className="space-y-1.5">
                      <WorkoutRow
                        workout={w}
                        onToggle={toggleComplete}
                        onEdit={setEditing}
                      />
                      {w.flexible && w.windowStart && w.windowEnd ? (
                        <div className="flex flex-wrap items-center gap-1.5 pl-10">
                          <span className="text-[11px] text-muted-foreground">
                            {t("plan.pickDay")}:
                          </span>
                          {eachDayOfInterval({
                            start: fromISO(w.windowStart),
                            end: fromISO(w.windowEnd),
                          }).map((d) => {
                            const iso = toISO(d);
                            return (
                              <button
                                key={iso}
                                type="button"
                                onClick={() => updateWorkout(w.id, { date: iso })}
                                className={cn(
                                  "rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors",
                                  iso === w.date
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-accent",
                                )}
                              >
                                {format(d, "EEE d", { locale: getDateLocale() })}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
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
