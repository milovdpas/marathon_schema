"use client";

import { Gauge, Mountain, Route, Timer } from "lucide-react";
import { StatCard } from "@/components/common/stat-card";
import { LongRunProgressChart } from "@/components/stats/longrun-progress-chart";
import { WeeklyTrendChart } from "@/components/stats/weekly-trend-chart";
import { Card } from "@/components/ui/card";
import { useStats } from "@/hooks/use-stats";
import { useTrainingStore } from "@/store/use-training-store";

export function StatsView() {
  const plan = useTrainingStore((s) => s.plan);
  const stats = useStats(plan);

  if (!plan || !stats) return null;
  const { overall } = stats;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total distance"
          value={overall.totalKm}
          unit="km"
          sub={`of ${overall.plannedTotalKm} km planned`}
          icon={<Route className="size-4" />}
        />
        <StatCard
          label="Longest run"
          value={overall.longestRunKm}
          unit="km"
          icon={<Mountain className="size-4" />}
        />
        <StatCard
          label="Avg pace"
          value={overall.averagePace}
          unit="/km"
          icon={<Gauge className="size-4" />}
        />
        <StatCard
          label="Runs completed"
          value={overall.completedCount}
          sub={`${overall.completionPct}% of plan`}
          icon={<Timer className="size-4" />}
        />
      </div>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Weekly mileage</h3>
        <WeeklyTrendChart data={stats.weekly} />
      </Card>

      <Card className="p-4">
        <h3 className="mb-1 text-sm font-semibold">Long-run progression</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Building to a 30 km peak, then tapering for race day.
        </p>
        <LongRunProgressChart data={stats.longRuns} />
      </Card>
    </div>
  );
}
