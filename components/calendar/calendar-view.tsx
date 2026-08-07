"use client";

import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { NoPlanState } from "@/components/common/no-plan-state";
import { TYPE_STYLE, WorkoutTypeDot } from "@/components/common/workout-type-badge";
import { AgendaView } from "@/components/calendar/agenda-view";
import { CalendarLegend } from "@/components/calendar/calendar-legend";
import { DayDetailSheet } from "@/components/calendar/day-detail-sheet";
import { useCalendarWeather } from "@/components/calendar/use-calendar-weather";
import { WeatherBadge } from "@/components/calendar/weather-badge";
import { WorkoutFormDialog } from "@/components/plan/workout-form-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DayDetail } from "@/components/calendar/day-detail";
import { formatRange, fromISO, offDayForDate, toISO } from "@/lib/date";
import { getDateLocale } from "@/lib/date-locale";
import type { CalendarViewMode, Workout, WorkoutType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { enableWeather } from "@/lib/weather-sync";
import { useActivePlan } from "@/hooks/use-active-plan";
import { toast } from "@/store/use-toast-store";
import { useTrainingStore } from "@/store/use-training-store";
import { useWeatherStore } from "@/store/use-weather-store";

export type { CalendarViewMode };

/** A multi-day period rendered as a spanning bar (off day or flexible workout). */
interface BarEvent {
  key: string;
  start: string; // ISO
  end: string; // ISO (inclusive)
  label: string;
  kind: "off" | "flex";
  type?: WorkoutType; // for flex bars (color)
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
  const setPreferences = useTrainingStore((s) => s.setPreferences);
  const weatherEnabled = useTrainingStore((s) => s.preferences.weatherEnabled);
  const weatherCalendar = useTrainingStore((s) => s.preferences.weatherCalendar);
  const weatherConfigured = useWeatherStore((s) => s.configured);
  const [weatherBusy, setWeatherBusy] = useState(false);

  const weatherOn = !!weatherEnabled && !!weatherCalendar;

  // Calendar weather chip: turning it on enables the feature (location prompt)
  // if needed, then shows weather in the calendar; turning it off just hides it.
  const toggleCalendarWeather = async () => {
    if (weatherOn) {
      setPreferences({ weatherCalendar: false });
      return;
    }
    if (weatherEnabled) {
      setPreferences({ weatherCalendar: true });
      return;
    }
    setWeatherBusy(true);
    const result = await enableWeather();
    setWeatherBusy(false);
    if (result === "ok") setPreferences({ weatherCalendar: true });
    else toast.error(t("weather.locationDenied"));
  };

  // Localized Mon–Sun short weekday headers.
  const weekdays = useMemo(() => {
    const start = startOfWeek(new Date(2024, 0, 1), { weekStartsOn: 1 }); // a Monday
    return Array.from({ length: 7 }, (_, i) =>
      format(addDays(start, i), "EEE", { locale: getDateLocale() }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  // Once you pick a view it's persisted, so navigating away and back keeps it.
  // Until then, default by device: the scrolling agenda reads best on a phone,
  // the month grid on a wide screen. Safe to read `window` during render here
  // because HydrationGate means this only ever mounts client-side.
  const savedView = useTrainingStore((s) => s.preferences.calendarView);
  const [defaultView] = useState<CalendarViewMode>(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 768px)").matches
      ? "month"
      : "agenda",
  );
  const view = savedView ?? defaultView;
  const setView = (v: CalendarViewMode) => setPreferences({ calendarView: v });
  // One anchor date drives all three views; each interprets it differently.
  const [anchor, setAnchor] = useState(() => new Date());
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

  // Always a whole number of week-aligned weeks: the month's grid, or the week
  // containing the anchor. `useCalendarWeather` walks this in strides of 7, so
  // even the day view feeds it the containing week rather than a lone day.
  const days = useMemo(() => {
    if (view === "month") {
      return eachDayOfInterval({
        start: startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 }),
      });
    }
    // Agenda spans the whole plan, but fetching weather for every one of its
    // weeks would burn the daily API budget for forecasts that don't exist
    // that far out. Feed it this week only; that's where a forecast is real.
    const base = view === "agenda" ? new Date() : anchor;
    return eachDayOfInterval({
      start: startOfWeek(base, { weekStartsOn: 1 }),
      end: endOfWeek(base, { weekStartsOn: 1 }),
    });
  }, [anchor, view]);

  const weather = useCalendarWeather(days);

  if (!plan) return <NoPlanState />;

  const offDays = plan.offDays ?? [];
  const allWorkouts = Object.values(plan.workouts);
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

  // The arrows move by whatever unit the current view shows.
  const step = (d: Date, dir: number) =>
    view === "month"
      ? addMonths(d, dir)
      : view === "week"
        ? addWeeks(d, dir)
        : addDays(d, dir);

  const locale = getDateLocale();
  // Agenda scrolls the whole plan, so there is no range to name and nothing
  // for the arrows to step; its sticky month headers do the job instead.
  const paged = view !== "agenda";
  const rangeTitle =
    view === "month"
      ? format(anchor, "MMMM yyyy", { locale })
      : view === "week"
        ? formatRange(toISO(days[0]), toISO(days[6]))
        : view === "day"
          ? format(anchor, "EEEE d MMMM", { locale })
          : t("calendar.viewAgenda");

  const anchorIso = toISO(anchor);
  const dayFlexible = (flexByWindow.get(anchorIso) ?? []).filter(
    (w) => w.date !== anchorIso,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{rangeTitle}</h2>
        {paged ? (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAnchor(new Date())}
            >
              {t("calendar.today")}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("calendar.prev")}
              onClick={() => setAnchor((d) => step(d, -1))}
            >
              <ChevronLeft className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("calendar.next")}
              onClick={() => setAnchor((d) => step(d, 1))}
            >
              <ChevronRight className="size-5" />
            </Button>
          </div>
        ) : null}
      </div>

      {/* The picker stays put while you scroll. It parks under the mobile top
          bar (57px, sticky); on md+ that bar is gone and the sidebar takes
          over, so it parks at 0. Negative margins let its background span the
          full width against `main`'s px-4 / md:px-8. */}
      <div className="sticky top-[57px] z-20 -mx-4 bg-background px-4 py-2 md:top-0 md:-mx-8 md:px-8">
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as CalendarViewMode)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="month">{t("calendar.viewMonth")}</TabsTrigger>
            <TabsTrigger value="week">{t("calendar.viewWeek")}</TabsTrigger>
            <TabsTrigger value="day">{t("calendar.viewDay")}</TabsTrigger>
            <TabsTrigger value="agenda">{t("calendar.viewAgenda")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "agenda" ? (
        // overflow-visible so the month headers inside can actually stick.
        <Card className="overflow-visible p-3">
          <AgendaView
            workouts={allWorkouts}
            offDays={offDays}
            weather={weather}
            onToggle={toggleComplete}
            onEdit={setEditing}
          />
        </Card>
      ) : view === "day" ? (
        <Card className="p-4">
          <DayDetail
            date={anchorIso}
            workouts={byDate.get(anchorIso) ?? []}
            flexibleInWindow={dayFlexible}
            offDay={offDayForDate(offDays, anchorIso)}
            onToggle={toggleComplete}
            onEdit={setEditing}
            onAdd={setAddDate}
            onReschedule={(id, date) => updateWorkout(id, { date })}
          />
        </Card>
      ) : (
      // overflow-visible: Card defaults to overflow-hidden, which turns the
      // sticky weekday row below into a no-op.
      <Card className="overflow-visible p-2">
        {/* Sticks directly under the picker: 57 (mobile bar) + 54 (picker
            block: 38px tabs + py-2), and just the picker block on md+. */}
        <div className="sticky top-[111px] z-10 -mx-2 grid grid-cols-7 gap-1 rounded-t-xl bg-card px-2 pt-1 md:top-[54px]">
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
                    // A week view is always "this week", so nothing is faded.
                    const inMonth = view === "week" || isSameMonth(day, anchor);
                    const today = isToday(day);
                    const isWeek = view === "week";
                    return (
                      <button
                        type="button"
                        key={iso}
                        onClick={() => setSelectedDate(iso)}
                        className={cn(
                          "flex flex-col gap-1 rounded-lg p-1 text-sm transition-colors hover:bg-accent",
                          isWeek
                            ? "min-h-28 items-stretch"
                            : "aspect-square items-center",
                          !inMonth && "text-muted-foreground/40",
                          today && "ring-1 ring-primary",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs tabular-nums",
                            isWeek && "self-center",
                            today &&
                              "bg-primary font-semibold text-primary-foreground",
                          )}
                        >
                          {format(day, "d")}
                        </span>
                        {isWeek ? (
                          // Room to name the sessions rather than hint at them.
                          <span className="flex min-w-0 flex-col gap-0.5">
                            {dots.map((w) => (
                              <span
                                key={w.id}
                                title={w.title}
                                className={cn(
                                  // A 7th of a phone screen is ~48px, so
                                  // truncating leaves "Easy…". Wrap to two
                                  // lines instead and keep the full text in
                                  // the tooltip.
                                  "line-clamp-2 break-words rounded px-1 py-0.5 text-left text-[10px] font-medium leading-tight",
                                  TYPE_STYLE[w.type].badge,
                                  !w.completed && "opacity-60",
                                )}
                              >
                                {w.title}
                              </span>
                            ))}
                          </span>
                        ) : (
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
                        )}
                        {weather[iso] ? (
                          <WeatherBadge
                            snapshot={weather[iso]}
                            className={cn(isWeek && "mt-auto self-center")}
                          />
                        ) : null}
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
      )}

      {/* In the grid views the legend just follows the calendar. The agenda is
          thousands of pixels long, so scrolling to the bottom for it isn't
          realistic — pin it above the mobile nav bar instead. It sticks to
          bottom-0 and pads its own content clear of the nav, so the background
          runs behind the nav rather than leaving a see-through strip. */}
      <div
        className={cn(
          "space-y-2",
          view === "agenda" &&
            "sticky bottom-0 z-20 -mx-4 border-t bg-background px-4 pb-[70px] pt-2 md:-mx-8 md:px-8 md:pb-2",
        )}
      >
        <CalendarLegend
          weatherConfigured={weatherConfigured}
          weatherOn={weatherOn}
          weatherBusy={weatherBusy}
          onToggleWeather={() => void toggleCalendarWeather()}
        />
        {/* Spanning bars only exist in the grid views. */}
        {view === "month" || view === "week" ? (
          <p className="text-xs text-muted-foreground">
            {t("calendar.flexLegend")}
          </p>
        ) : null}
      </div>

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
