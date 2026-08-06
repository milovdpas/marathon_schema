"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { paceToSeconds, secondsToPace } from "@/lib/pace";
import type { WorkoutSplit } from "@/lib/types";

/**
 * Pace per kilometre for a single run. Y is inverted (a faster pace — fewer
 * seconds — sits higher) and ticks are formatted back to mm:ss.
 */
export function SplitPaceChart({ splits }: { splits: WorkoutSplit[] }) {
  const rows = splits
    .map((s) => ({ label: String(s.km), sec: paceToSeconds(s.pace) }))
    .filter((r): r is { label: string; sec: number } => r.sec != null);
  if (rows.length === 0) return null;

  const secs = rows.map((r) => r.sec);
  const pad = 15;
  const min = Math.min(...secs) - pad;
  const max = Math.max(...secs) + pad;

  return (
    <ResponsiveContainer width="100%" height={220}>
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
        />
        <YAxis
          reversed
          domain={[min, max]}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(v: number) => secondsToPace(v)}
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
          formatter={(value) => secondsToPace(Number(value))}
        />
        <Bar dataKey="sec" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
