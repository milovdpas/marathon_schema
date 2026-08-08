"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import { useFormat } from "@/hooks/use-format";
import type { WeeklyMileage } from "@/lib/plan/stats";

export function WeeklyTrendChart({ data }: { data: WeeklyMileage[] }) {
  const { t } = useTranslation();
  const fmt = useFormat();
  // Converted here rather than in `lib/plan/stats.ts`: stats stay canonical km
  // so every consumer (including the AI export) sees the same numbers.
  const rows = data.map((d) => ({
    ...d,
    plannedKm: fmt.distanceNumber(d.plannedKm),
    actualKm: fmt.distanceNumber(d.actualKm),
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="var(--border)"
        />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          width={44}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: "var(--accent)" }}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 12,
            color: "var(--popover-foreground)",
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar
          dataKey="plannedKm"
          name={t("stats.planned")}
          fill="var(--muted-foreground)"
          fillOpacity={0.3}
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="actualKm"
          name={t("stats.actual")}
          fill="var(--chart-1)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
