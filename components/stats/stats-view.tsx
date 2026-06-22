"use client";

import { Gauge, Maximize2, Mountain, Route, Timer } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { NoPlanState } from "@/components/common/no-plan-state";
import { StatCard } from "@/components/common/stat-card";
import { LongRunProgressChart } from "@/components/stats/longrun-progress-chart";
import { WeeklyHistoryChart } from "@/components/stats/weekly-history-chart";
import { WeeklyTrendChart } from "@/components/stats/weekly-trend-chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { useActivePlan } from "@/hooks/use-active-plan";
import { useStats } from "@/hooks/use-stats";
import { weeklyHistory } from "@/lib/stats";
import { useTrainingStore } from "@/store/use-training-store";

export function StatsView() {
  const { t } = useTranslation();
  const plan = useActivePlan();
  const stats = useStats(plan);
  const plans = useTrainingStore((s) => s.plans);

  // Every logged run across all plans, bucketed by calendar week.
  const history = useMemo(
    () =>
      weeklyHistory(
        Object.values(plans).flatMap((p) => Object.values(p.workouts)),
      ),
    [plans],
  );

  if (!plan || !stats) return <NoPlanState />;
  const { overall } = stats;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label={t("stats.totalDistance")}
          value={overall.totalKm}
          unit={t("common.km")}
          sub={t("stats.ofPlanned", { km: overall.plannedTotalKm })}
          icon={<Route className="size-4" />}
        />
        <StatCard
          label={t("stats.longestRun")}
          value={overall.longestRunKm}
          unit={t("common.km")}
          icon={<Mountain className="size-4" />}
        />
        <StatCard
          label={t("stats.avgPace")}
          value={overall.averagePace}
          unit={t("common.perKm")}
          icon={<Gauge className="size-4" />}
        />
        <StatCard
          label={t("stats.runsCompleted")}
          value={overall.completedCount}
          sub={t("stats.pctOfPlan", { pct: overall.completionPct })}
          icon={<Timer className="size-4" />}
        />
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t("stats.weeklyMileage")}</h3>
          <Dialog>
            <DialogTrigger
              render={
                <button
                  type="button"
                  aria-label={t("stats.historyTitle")}
                  className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                />
              }
            >
              <Maximize2 className="size-4" />
            </DialogTrigger>
            <DialogContent className="max-h-[90dvh] w-[95vw] max-w-3xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("stats.historyTitle")}</DialogTitle>
                <DialogDescription>{t("stats.historySub")}</DialogDescription>
              </DialogHeader>
              <WeeklyHistoryChart data={history} />
            </DialogContent>
          </Dialog>
        </div>
        <WeeklyTrendChart data={stats.weekly} />
      </Card>

      <Card className="p-4">
        <h3 className="mb-1 text-sm font-semibold">
          {t("stats.longRunProgression")}
        </h3>
        <p className="mb-3 text-xs text-muted-foreground">
          {t("stats.longRunHint")}
        </p>
        <LongRunProgressChart data={stats.longRuns} />
      </Card>
    </div>
  );
}
