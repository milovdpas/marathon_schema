"use client";

import { format, isToday } from "date-fns";
import { CalendarRange } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { WeatherBadge } from "@/components/calendar/weather-badge";
import { WorkoutRow } from "@/components/common/workout-row";
import { fromISO, offDayForDate, todayISO } from "@/lib/date";
import { getDateLocale } from "@/lib/date-locale";
import type { OffDay, WeatherSnapshot, Workout } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AgendaDay {
  iso: string;
  workouts: Workout[];
  offDay?: OffDay;
  /** Set when this day opens a new month, so we can print a divider. */
  monthLabel?: string;
}

/**
 * The whole plan as one scrollable list, skipping every empty day. Built for
 * mobile: you thumb through your training instead of paging month by month.
 */
export function AgendaView({
  workouts,
  offDays,
  weather,
  onToggle,
  onEdit,
  className,
}: {
  workouts: Workout[];
  offDays: OffDay[];
  weather: Record<string, WeatherSnapshot>;
  onToggle: (id: string) => void;
  onEdit: (workout: Workout) => void;
  className?: string;
}) {
  const { t, i18n } = useTranslation();
  const today = todayISO();
  const todayAnchor = useRef<HTMLDivElement>(null);

  const days = useMemo(() => {
    const byDate = new Map<string, Workout[]>();
    for (const w of workouts) {
      const list = byDate.get(w.date) ?? [];
      list.push(w);
      byDate.set(w.date, list);
    }

    const sorted = [...byDate.keys()].sort();
    return sorted.map((iso, i): AgendaDay => {
      const month = format(fromISO(iso), "MMMM yyyy", {
        locale: getDateLocale(),
      });
      // ISO dates sort chronologically, so "same month as the day before"
      // is just a prefix comparison — no running state to carry.
      const newMonth = i === 0 || sorted[i - 1].slice(0, 7) !== iso.slice(0, 7);
      return {
        iso,
        workouts: byDate.get(iso)!,
        offDay: offDayForDate(offDays, iso),
        monthLabel: newMonth ? month : undefined,
      };
    });
    // getDateLocale() reads the active language, which isn't a value dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workouts, offDays, i18n.language]);

  // Open on the last run you actually finished, so what you just did sits at
  // the top and what's coming reads down from it.
  useEffect(() => {
    todayAnchor.current?.scrollIntoView({ block: "start" });
  }, [days]);

  if (days.length === 0) {
    return (
      <p className={cn("py-8 text-center text-sm text-muted-foreground", className)}>
        {t("calendar.agendaEmpty")}
      </p>
    );
  }

  // Where the list opens: the most recent day you logged a run on. Before the
  // block starts nothing is done yet, so fall back to the first upcoming day
  // rather than dropping the user at week 1.
  const lastDone = [...days]
    .reverse()
    .find((d) => d.workouts.some((w) => w.completed || w.actualDistanceKm != null));
  const anchorIso =
    lastDone?.iso ??
    days.find((d) => d.iso >= today)?.iso ??
    days[days.length - 1].iso;

  return (
    <div className={className}>
      <div className="space-y-3">
        {days.map((day) => {
          const date = fromISO(day.iso);
          const isPast = day.iso < today;
          return (
            <div
              key={day.iso}
              ref={day.iso === anchorIso ? todayAnchor : undefined}
            >
              {day.monthLabel ? (
                // Parks under the view picker (57px mobile bar + 54px picker);
                // z-10 keeps it below the pinned legend's z-20.
                <h3 className="sticky top-[111px] z-10 -mx-1 bg-card/95 px-1 pb-1.5 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur md:top-[54px]">
                  {day.monthLabel}
                </h3>
              ) : null}

              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className={cn(
                    "text-sm font-medium",
                    isToday(date) && "text-primary",
                    isPast && "text-muted-foreground",
                  )}
                >
                  {format(date, "EEEE d", { locale: getDateLocale() })}
                </span>
                {isToday(date) ? (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    {t("calendar.today")}
                  </span>
                ) : null}
                {day.offDay ? (
                  <span
                    title={day.offDay.title}
                    className="inline-flex min-w-0 items-center gap-1 rounded-full bg-tempo/15 px-2 py-0.5 text-[10px] font-medium text-tempo"
                  >
                    <CalendarRange className="size-3 shrink-0" />
                    <span className="truncate">{day.offDay.title}</span>
                  </span>
                ) : null}
                {weather[day.iso] ? (
                  <WeatherBadge snapshot={weather[day.iso]} className="ml-auto" />
                ) : null}
              </div>

              <div className={cn("space-y-1.5", isPast && "opacity-60")}>
                {day.workouts.map((w) => (
                  <WorkoutRow
                    key={w.id}
                    workout={w}
                    showDate={false}
                    onToggle={onToggle}
                    onEdit={onEdit}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
