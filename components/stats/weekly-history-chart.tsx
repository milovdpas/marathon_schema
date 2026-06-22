"use client";

import { format } from "date-fns";
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
import { fromISO } from "@/lib/date";
import { getDateLocale } from "@/lib/date-locale";
import type { WeekHistoryPoint } from "@/lib/stats";

export function WeeklyHistoryChart({ data }: { data: WeekHistoryPoint[] }) {
  const { t } = useTranslation();
  const rows = data.map((d) => ({
    planned: d.plannedKm,
    actual: d.actualKm,
    label: format(fromISO(d.weekStart), "d MMM", { locale: getDateLocale() }),
  }));
  // Give every week room; scroll horizontally when there are many.
  const width = Math.max(320, rows.length * 34);

  return (
    <div className="overflow-x-auto">
      <div style={{ width }}>
        <ResponsiveContainer width="100%" height={320}>
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
              minTickGap={16}
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
              dataKey="planned"
              name={t("stats.planned")}
              fill="var(--muted-foreground)"
              fillOpacity={0.3}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="actual"
              name={t("stats.actual")}
              fill="var(--chart-1)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
