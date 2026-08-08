// Which days a calendar view shows, and how its arrows move.

import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { CalendarViewMode } from "@/lib/types";

const MONDAY = { weekStartsOn: 1 } as const;

/**
 * The visible days for a view: always a whole number of Monday-aligned weeks,
 * because `useCalendarWeather` walks the result in strides of 7. Even the day
 * view therefore returns its containing week rather than a lone day.
 *
 * Agenda is the exception: it lists the whole plan, but fetching weather for
 * every one of its weeks would burn the daily API budget on forecasts that
 * don't exist that far out. It gets this week only, which is the only range
 * where a forecast is real.
 */
export function visibleDays(
  view: CalendarViewMode,
  anchor: Date,
  today: Date = new Date(),
): Date[] {
  if (view === "month") {
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(anchor), MONDAY),
      end: endOfWeek(endOfMonth(anchor), MONDAY),
    });
  }
  const base = view === "agenda" ? today : anchor;
  return eachDayOfInterval({
    start: startOfWeek(base, MONDAY),
    end: endOfWeek(base, MONDAY),
  });
}

/** Move the anchor by whatever unit the current view shows. */
export function stepAnchor(
  view: CalendarViewMode,
  anchor: Date,
  dir: 1 | -1,
): Date {
  if (view === "month") return addMonths(anchor, dir);
  if (view === "week") return addWeeks(anchor, dir);
  return addDays(anchor, dir);
}
