"use client";

import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { NoPlanState } from "@/components/common/no-plan-state";
import { TYPE_STYLE, WorkoutTypeDot } from "@/components/common/workout-type-badge";
import { DayDetailSheet } from "@/components/calendar/day-detail-sheet";
import { WorkoutFormDialog } from "@/components/plan/workout-form-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fromISO, offDayForDate, toISO } from "@/lib/date";
import { getDateLocale } from "@/lib/date-locale";
import type { Workout, WorkoutType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useActivePlan } from "@/hooks/use-active-plan";
import { useTrainingStore } from "@/store/use-training-store";

/** A multi-day period rendered as a spanning bar (off day or flexible workout). */
interface BarEvent {
  key: string;
  start: string; // ISO
  end: string; // ISO (inclusive)
  label: string;
  kind: "off" | "flex";
  type?: WorkoutType; // for flex bars (colour)
  chosenDate?: string; // for flex bars (highlighted day)
}

interface PlacedBar {
  ev: BarEvent;
  startCol: number;
  span: number;
  startIso: string;
  continuesLeft: boolean;
  continuesRight: boolean;
  chosenOffset?: number; // column within the bar that's currently planned
  track: number;
}

/** Lay periods out into non-overlapping tracks for a single week (7 days). */
function placeBars(week: Date[], events: BarEvent[]): PlacedBar[] {
  const isoOf = week.map(toISO);
  const weekStart = isoOf[0];
  const weekEnd = isoOf[6];
  const trackEnds: number[] = [];
  const out: PlacedBar[] = [];
  const inWeek = events
    .filter((e) => e.start <= weekEnd && e.end >= weekStart)
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  for (const ev of inWeek) {
    const segStart = ev.start < weekStart ? weekStart : ev.start;
    const segEnd = ev.end > weekEnd ? weekEnd : ev.end;
    const startCol = isoOf.indexOf(segStart);
    const endCol = isoOf.indexOf(segEnd);
    if (startCol < 0 || endCol < 0) continue;
    let track = trackEnds.findIndex((end) => end < startCol);
    if (track === -1) track = trackEnds.length;
    trackEnds[track] = endCol;
    let chosenOffset: number | undefined;
    if (ev.kind === "flex" && ev.chosenDate) {
      const ci = isoOf.indexOf(ev.chosenDate);
      if (ci >= startCol && ci <= endCol) chosenOffset = ci - startCol;
    }
    out.push({
      ev,
      startCol,
      span: endCol - startCol + 1,
      startIso: segStart,
      continuesLeft: ev.start < weekStart,
      continuesRight: ev.end > weekEnd,
      chosenOffset,
      track,
    });
  }
  return out;
}

export function CalendarView() {
  const { t, i18n } = useTranslation();
  const plan = useActivePlan();
  const toggleComplete = useTrainingStore((s) => s.toggleComplete);
  const updateWorkout = useTrainingStore((s) => s.updateWorkout);

  // Localized Mon–Sun short weekday headers.
  const weekdays = useMemo(() => {
    const start = startOfWeek(new Date(2024, 0, 1), { weekStartsOn: 1 }); // a Monday
    return Array.from({ length: 7 }, (_, i) =>
      format(addDays(start, i), "EEE", { locale: getDateLocale() }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editing, setEditing] = useState<Workout | null>(null);
  const [addDate, setAddDate] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, Workout[]>();
    if (plan) {
      for (const w of Object.values(plan.workouts)) {
        const list = map.get(w.date) ?? [];
        list.push(w);
        map.set(w.date, list);
      }
    }
    return map;
  }, [plan]);

  // Every day inside a flexible workout's window → the workouts choosable there.
  const flexByWindow = useMemo(() => {
    const map = new Map<string, Workout[]>();
    if (plan) {
      for (const w of Object.values(plan.workouts)) {
        if (!w.flexible || !w.windowStart || !w.windowEnd) continue;
        for (const d of eachDayOfInterval({
          start: fromISO(w.windowStart),
          end: fromISO(w.windowEnd),
        })) {
          const iso = toISO(d);
          const list = map.get(iso) ?? [];
          list.push(w);
          map.set(iso, list);
        }
      }
    }
    return map;
  }, [plan]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  if (!plan) return <NoPlanState />;

  const offDays = plan.offDays ?? [];
  const selectedWorkouts = selectedDate ? byDate.get(selectedDate) ?? [] : [];
  const selectedOffDay = selectedDate
    ? offDayForDate(offDays, selectedDate)
    : undefined;
  // Flexible workouts whose window covers the selected day but are scheduled
  // on a different day (so the sheet can offer to move them here).
  const selectedFlexible = selectedDate
    ? (flexByWindow.get(selectedDate) ?? []).filter(
        (w) => w.date !== selectedDate,
      )
    : [];

  // Periods rendered as spanning bars: off days + flexible workouts.
  const barEvents: BarEvent[] = [
    ...offDays.map((o) => ({
      key: `off-${o.id}`,
      start: o.start,
      end: o.end,
      label: o.title,
      kind: "off" as const,
    })),
    ...Object.values(plan.workouts)
      .filter((w) => w.flexible && w.windowStart && w.windowEnd)
      .map((w) => ({
        key: `flex-${w.id}`,
        start: w.windowStart as string,
        end: w.windowEnd as string,
        label: w.title,
        kind: "flex" as const,
        type: w.type,
        chosenDate: w.date,
      })),
  ];

  // Chunk the day grid into weeks of 7 for row-by-row bar layout.
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {format(month, "MMMM yyyy", { locale: getDateLocale() })}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMonth(startOfMonth(new Date()))}
          >
            {t("calendar.today")}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("calendar.prevMonth")}
            onClick={() => setMonth((m) => subMonths(m, 1))}
          >
            <ChevronLeft className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("calendar.nextMonth")}
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </div>

      <Card className="p-2">
        <div className="grid grid-cols-7 gap-1">
          {weekdays.map((d) => (
            <div
              key={d}
              className="pb-1 text-center text-[11px] font-medium text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="space-y-1">
          {weeks.map((week, wi) => {
            const bars = placeBars(week, barEvents);
            const trackCount = bars.reduce((m, b) => Math.max(m, b.track + 1), 0);
            return (
              <div key={wi}>
                {/* Day numbers + single-day workout dots */}
                <div className="grid grid-cols-7 gap-1">
                  {week.map((day) => {
                    const iso = toISO(day);
                    const dots = (byDate.get(iso) ?? []).filter((w) => !w.flexible);
                    const inMonth = isSameMonth(day, month);
                    const today = isToday(day);
                    return (
                      <button
                        type="button"
                        key={iso}
                        onClick={() => setSelectedDate(iso)}
                        className={cn(
                          "flex aspect-square flex-col items-center gap-1 rounded-lg p-1 text-sm transition-colors hover:bg-accent",
                          !inMonth && "text-muted-foreground/40",
                          today && "ring-1 ring-primary",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 grid size-6 place-items-center rounded-full text-xs tabular-nums",
                            today &&
                              "bg-primary font-semibold text-primary-foreground",
                          )}
                        >
                          {format(day, "d")}
                        </span>
                        <span className="flex flex-wrap items-center justify-center gap-0.5">
                          {dots.slice(0, 4).map((w) => (
                            <WorkoutTypeDot
                              key={w.id}
                              type={w.type}
                              className={cn(
                                "size-1.5",
                                !w.completed && "opacity-40",
                              )}
                            />
                          ))}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {/* Spanning period bars (off days + flexible workouts) */}
                {Array.from({ length: trackCount }).map((_, track) => (
                  <div key={track} className="mt-0.5 grid grid-cols-7 gap-1">
                    {bars
                      .filter((b) => b.track === track)
                      .map((bar) => {
                        const isFlex = bar.ev.kind === "flex";
                        return (
                          <button
                            key={bar.ev.key}
                            type="button"
                            title={bar.ev.label}
                            onClick={() =>
                              setSelectedDate(
                                isFlex
                                  ? (bar.ev.chosenDate ?? bar.startIso)
                                  : bar.startIso,
                              )
                            }
                            style={{
                              gridColumn: `${bar.startCol + 1} / span ${bar.span}`,
                            }}
                            className={cn(
                              "relative flex h-5 items-center overflow-hidden rounded-md px-1.5 pb-1 text-left text-[10px] font-medium",
                              isFlex
                                ? TYPE_STYLE[bar.ev.type!].badge
                                : "bg-tempo/15 text-tempo",
                              bar.continuesLeft && "rounded-l-none",
                              bar.continuesRight && "rounded-r-none",
                            )}
                          >
                            <span className="truncate">{bar.ev.label}</span>
                            {/* Underline marks the day the flexible workout is
                                planned on — kept clear of the label. */}
                            {isFlex && bar.chosenOffset != null ? (
                              <span
                                className={cn(
                                  "pointer-events-none absolute bottom-[2px] h-[3px] rounded-full",
                                  TYPE_STYLE[bar.ev.type!].dot,
                                )}
                                style={{
                                  left: `calc(${(bar.chosenOffset / bar.span) * 100}% + 4px)`,
                                  width: `calc(${(1 / bar.span) * 100}% - 8px)`,
                                }}
                              />
                            ) : null}
                          </button>
                        );
                      })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </Card>

      <p className="text-xs text-muted-foreground">{t("calendar.legend")}</p>
      <p className="-mt-2 text-xs text-muted-foreground">
        {t("calendar.flexLegend")}
      </p>

      <DayDetailSheet
        date={selectedDate}
        workouts={selectedWorkouts}
        flexibleInWindow={selectedFlexible}
        offDay={selectedOffDay}
        onReschedule={(id, date) => updateWorkout(id, { date })}
        onOpenChange={(o) => !o && setSelectedDate(null)}
        onToggle={toggleComplete}
        onEdit={(w) => {
          setSelectedDate(null);
          setEditing(w);
        }}
        onAdd={(d) => {
          setSelectedDate(null);
          setAddDate(d);
        }}
      />

      <WorkoutFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        workout={editing}
      />
      <WorkoutFormDialog
        open={!!addDate}
        onOpenChange={(o) => !o && setAddDate(null)}
        defaultDate={addDate ?? undefined}
      />
    </div>
  );
}
