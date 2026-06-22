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
import { ChevronLeft, ChevronRight, Umbrella } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { NoPlanState } from "@/components/common/no-plan-state";
import { WorkoutTypeDot } from "@/components/common/workout-type-badge";
import { DayDetailSheet } from "@/components/calendar/day-detail-sheet";
import { WorkoutFormDialog } from "@/components/plan/workout-form-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { offDayForDate, toISO } from "@/lib/date";
import { getDateLocale } from "@/lib/date-locale";
import type { Workout } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useActivePlan } from "@/hooks/use-active-plan";
import { useTrainingStore } from "@/store/use-training-store";

export function CalendarView() {
  const { t, i18n } = useTranslation();
  const plan = useActivePlan();
  const toggleComplete = useTrainingStore((s) => s.toggleComplete);

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

      <Card className="p-3">
        <div className="grid grid-cols-7 gap-1">
          {weekdays.map((d) => (
            <div
              key={d}
              className="pb-1 text-center text-[11px] font-medium text-muted-foreground"
            >
              {d}
            </div>
          ))}
          {days.map((day) => {
            const iso = toISO(day);
            const workouts = byDate.get(iso) ?? [];
            const inMonth = isSameMonth(day, month);
            const today = isToday(day);
            const off = offDayForDate(offDays, iso);
            const allDone =
              workouts.length > 0 && workouts.every((w) => w.completed);

            return (
              <button
                type="button"
                key={iso}
                onClick={() => setSelectedDate(iso)}
                title={off?.title}
                className={cn(
                  "flex aspect-square flex-col items-center justify-start gap-1 rounded-lg p-1 text-sm transition-colors hover:bg-accent",
                  !inMonth && "text-muted-foreground/40",
                  off && "bg-tempo/10",
                  today && "ring-1 ring-primary",
                  allDone && !off && "bg-primary/5",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-6 place-items-center rounded-full text-xs tabular-nums",
                    today && "bg-primary font-semibold text-primary-foreground",
                  )}
                >
                  {format(day, "d")}
                </span>
                <span className="flex flex-wrap items-center justify-center gap-0.5">
                  {off ? <Umbrella className="size-3 text-tempo" /> : null}
                  {workouts.slice(0, 3).map((w) => (
                    <WorkoutTypeDot
                      key={w.id}
                      type={w.type}
                      className={cn("size-1.5", !w.completed && "opacity-40")}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <p className="text-xs text-muted-foreground">{t("calendar.legend")}</p>

      <DayDetailSheet
        date={selectedDate}
        workouts={selectedWorkouts}
        offDay={selectedOffDay}
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
