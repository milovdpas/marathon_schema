"use client";

import { Gauge, Mountain, Route, Timer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { StatCard } from "@/components/common/stat-card";
import { LongRunProgressChart } from "@/components/stats/longrun-progress-chart";
import { WeeklyTrendChart } from "@/components/stats/weekly-trend-chart";
import { Card } from "@/components/ui/card";
import { useActivePlan } from "@/hooks/use-active-plan";
import { useStats } from "@/hooks/use-stats";

export function StatsView() {
  const { t } = useTranslation();
  const plan = useActivePlan();
  const stats = useStats(plan);

  if (!plan || !stats) return null;
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
        <h3 className="mb-3 text-sm font-semibold">{t("stats.weeklyMileage")}</h3>
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
