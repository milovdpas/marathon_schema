"use client";

import { differenceInCalendarDays, format } from "date-fns";
import { CalendarDays, Flame, Footprints, Target } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { CompleteWorkoutDialog } from "@/components/common/complete-workout-dialog";
import { NoPlanState } from "@/components/common/no-plan-state";
import { ProgressRing } from "@/components/common/progress-ring";
import { StatCard } from "@/components/common/stat-card";
import { WorkoutRow } from "@/components/common/workout-row";
import { Card } from "@/components/ui/card";
import { fromISO, startOfToday } from "@/lib/date";
import { getDateLocale } from "@/lib/date-locale";
import type { Workout } from "@/lib/types";
import { useActivePlan } from "@/hooks/use-active-plan";
import { useStats } from "@/hooks/use-stats";
import { useTrainingStore } from "@/store/use-training-store";

export function DashboardView() {
  const { t } = useTranslation();
  const plan = useActivePlan();
  const toggleComplete = useTrainingStore((s) => s.toggleComplete);
  const stats = useStats(plan);
  const [completing, setCompleting] = useState<Workout | null>(null);

  // Completing a run opens the quick-log dialog (prefilled with the planned
  // target); un-checking a done run just flips it back.
  const handleToggle = (id: string) => {
    const w = plan?.workouts[id];
    if (!w) return;
    if (w.completed) toggleComplete(id);
    else setCompleting(w);
  };

  if (!plan || !stats) return <NoPlanState />;

  const raceDate = plan.raceDate;
  const daysToRace = Math.max(
    0,
    differenceInCalendarDays(fromISO(raceDate), startOfToday()),
  );

  // Progress along the training timeline (first week → race day).
  const planStart = fromISO(plan.weeks[0]?.startDate ?? raceDate);
  const totalDays = Math.max(
    1,
    differenceInCalendarDays(fromISO(raceDate), planStart),
  );
  const elapsedDays = differenceInCalendarDays(startOfToday(), planStart);
  const timelinePct = Math.max(
    0,
    Math.min(100, Math.round((elapsedDays / totalDays) * 100)),
  );

  return (
    <div className="space-y-5">
      {/* Hero: countdown + timeline */}
      <Card className="overflow-hidden">
        <div className="flex flex-col items-center gap-5 p-5 sm:flex-row sm:gap-7 sm:p-6">
          <ProgressRing value={timelinePct} size={140} strokeWidth={11}>
            <div className="text-center">
              <div className="text-3xl font-bold tabular-nums leading-none">
                {daysToRace}
              </div>
              <div className="mt-1 text-xs font-medium text-muted-foreground">
                {t("dashboard.daysToGo")}
              </div>
            </div>
          </ProgressRing>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-medium text-primary">
              {t("dashboard.goalLine", {
                goal: plan.goalLabel,
                pace: plan.goalPace,
              })}
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              {plan.raceName}
            </h2>
            <p className="mt-0.5 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
              <CalendarDays className="size-4" />
              {format(fromISO(raceDate), "EEEE d MMMM yyyy", {
                locale: getDateLocale(),
              })}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              <Trans
                i18nKey="dashboard.throughBlock"
                values={{ pct: timelinePct }}
                components={{ b: <span className="font-semibold text-foreground" /> }}
              />
            </p>
          </div>
        </div>
      </Card>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label={t("dashboard.planComplete")}
          value={stats.overall.completionPct}
          unit="%"
          sub={t("dashboard.workoutsRatio", {
            done: stats.overall.completedCount,
            total: stats.overall.totalCount,
          })}
          icon={<Target className="size-4" />}
        />
        <StatCard
          label={t("dashboard.totalDistance")}
          value={stats.overall.totalKm}
          unit={t("common.km")}
          sub={t("dashboard.longest", { km: stats.overall.longestRunKm })}
          icon={<Footprints className="size-4" />}
        />
        <StatCard
          label={t("dashboard.thisWeek")}
          value={stats.thisWeek.actualKm}
          unit={t("common.km")}
          sub={t("dashboard.ofPlanned", { km: stats.thisWeek.plannedKm })}
          icon={<Flame className="size-4" />}
        />
        <StatCard
          label={t("dashboard.thisMonth")}
          value={stats.thisMonth.actualKm}
          unit={t("common.km")}
          sub={t("dashboard.doneRatio", {
            done: stats.thisMonth.completed,
            total: stats.thisMonth.total,
          })}
          icon={<CalendarDays className="size-4" />}
        />
      </div>

      {/* Upcoming */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t("dashboard.upcoming")}</h3>
          <Link
            href="/plan"
            className="text-xs font-medium text-primary hover:underline"
          >
            {t("dashboard.viewPlan")}
          </Link>
        </div>
        <div className="space-y-2">
          {stats.upcoming.length === 0 ? (
            <Card className="p-4 text-sm text-muted-foreground">
              {t("dashboard.caughtUp")}
            </Card>
          ) : (
            stats.upcoming.map((w) => (
              <WorkoutRow key={w.id} workout={w} onToggle={handleToggle} />
            ))
          )}
        </div>
      </section>

      {/* Recent */}
      {stats.recent.length > 0 ? (
        <section>
          <h3 className="mb-2 text-sm font-semibold">{t("dashboard.recent")}</h3>
          <div className="space-y-2">
            {stats.recent.map((w) => (
              <WorkoutRow key={w.id} workout={w} onToggle={handleToggle} />
            ))}
          </div>
        </section>
      ) : null}

      <CompleteWorkoutDialog
        workout={completing}
        open={!!completing}
        onOpenChange={(o) => !o && setCompleting(null)}
      />
    </div>
  );
}
