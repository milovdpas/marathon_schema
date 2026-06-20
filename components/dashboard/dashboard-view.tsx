"use client";

import { differenceInCalendarDays, format } from "date-fns";
import { CalendarDays, Flame, Footprints, Target } from "lucide-react";
import Link from "next/link";
import { ProgressRing } from "@/components/common/progress-ring";
import { StatCard } from "@/components/common/stat-card";
import { WorkoutRow } from "@/components/common/workout-row";
import { Card } from "@/components/ui/card";
import { fromISO, startOfToday } from "@/lib/date";
import { useStats } from "@/hooks/use-stats";
import { useTrainingStore } from "@/store/use-training-store";

export function DashboardView() {
  const plan = useTrainingStore((s) => s.plan);
  const preferences = useTrainingStore((s) => s.preferences);
  const toggleComplete = useTrainingStore((s) => s.toggleComplete);
  const stats = useStats(plan);

  if (!plan || !stats) return null;

  const raceDate = preferences.raceDate;
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
                days to go
              </div>
            </div>
          </ProgressRing>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-medium text-primary">
              {preferences.goalLabel} · {preferences.goalPace}/km
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              {preferences.raceName}
            </h2>
            <p className="mt-0.5 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
              <CalendarDays className="size-4" />
              {format(fromISO(raceDate), "EEEE d MMMM yyyy")}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              You&apos;re{" "}
              <span className="font-semibold text-foreground">
                {timelinePct}%
              </span>{" "}
              through your training block.
            </p>
          </div>
        </div>
      </Card>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Plan complete"
          value={stats.overall.completionPct}
          unit="%"
          sub={`${stats.overall.completedCount}/${stats.overall.totalCount} workouts`}
          icon={<Target className="size-4" />}
        />
        <StatCard
          label="Total distance"
          value={stats.overall.totalKm}
          unit="km"
          sub={`longest ${stats.overall.longestRunKm} km`}
          icon={<Footprints className="size-4" />}
        />
        <StatCard
          label="This week"
          value={stats.thisWeek.actualKm}
          unit="km"
          sub={`of ${stats.thisWeek.plannedKm} km planned`}
          icon={<Flame className="size-4" />}
        />
        <StatCard
          label="This month"
          value={stats.thisMonth.actualKm}
          unit="km"
          sub={`${stats.thisMonth.completed}/${stats.thisMonth.total} done`}
          icon={<CalendarDays className="size-4" />}
        />
      </div>

      {/* Upcoming */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Upcoming workouts</h3>
          <Link
            href="/plan"
            className="text-xs font-medium text-primary hover:underline"
          >
            View plan
          </Link>
        </div>
        <div className="space-y-2">
          {stats.upcoming.length === 0 ? (
            <Card className="p-4 text-sm text-muted-foreground">
              No upcoming workouts — you&apos;re all caught up! 🎉
            </Card>
          ) : (
            stats.upcoming.map((w) => (
              <WorkoutRow
                key={w.id}
                workout={w}
                onToggle={toggleComplete}
              />
            ))
          )}
        </div>
      </section>

      {/* Recent */}
      {stats.recent.length > 0 ? (
        <section>
          <h3 className="mb-2 text-sm font-semibold">Recently completed</h3>
          <div className="space-y-2">
            {stats.recent.map((w) => (
              <WorkoutRow key={w.id} workout={w} onToggle={toggleComplete} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
