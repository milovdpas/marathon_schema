"use client";

import { useTranslation } from "react-i18next";
import { SportIcon } from "@/components/common/sport-icon";
import { Card } from "@/components/ui/card";
import { useFormat } from "@/hooks/use-format";
import type { SportStats } from "@/lib/plan/stats";

/**
 * Per-sport totals, shown only when a plan actually mixes sports.
 *
 * Distance is deliberately kept per sport rather than summed: 40 km on a bike
 * and 10 km running are not 50 km of anything. Time is the one figure that
 * survives being added up, so it gets the headline.
 */
export function SportBreakdown({ stats }: { stats: SportStats[] }) {
  const { t } = useTranslation();
  const fmt = useFormat();

  if (stats.length < 2) return null;

  /** "1h 20m", or "45m" when it's under the hour. */
  const hours = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return h > 0 ? t("stats.hours", { h, m }) : `${m}m`;
  };

  return (
    <Card className="gap-0 p-4">
      <h3 className="text-sm font-semibold">{t("stats.bySport")}</h3>
      <p className="mb-3 text-xs text-muted-foreground">
        {t("stats.bySportSub")}
      </p>
      <ul className="space-y-2">
        {stats.map((s) => (
          <li
            key={s.sport}
            className="flex items-center gap-3 rounded-xl border p-3"
          >
            <SportIcon sport={s.sport} className="size-4 text-primary" />
            <span className="flex-1 text-sm font-medium">
              {t(`sport.${s.sport}Plural`)}
            </span>
            <span className="text-sm tabular-nums">
              {fmt.distance(s.totalKm)}
            </span>
            <span className="w-16 text-right text-sm tabular-nums text-muted-foreground">
              {hours(s.totalTimeMin)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
