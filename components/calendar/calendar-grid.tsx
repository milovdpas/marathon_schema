"use client";

import { isSameMonth } from "date-fns";
import { CalendarBarTracks } from "@/components/calendar/calendar-bar-tracks";
import { CalendarDayCell } from "@/components/calendar/calendar-day-cell";
import { Card } from "@/components/ui/card";
import { type BarEvent, placeBars } from "@/lib/calendar-layout";
import { toISO } from "@/lib/date";
import type { WeatherSnapshot, Workout } from "@/lib/types";

/** The month and week grids: a weekday header, day cells, and spanning bars. */
export function CalendarGrid({
  weeks,
  weekdays,
  mode,
  anchor,
  byDate,
  barEvents,
  weather,
  onSelectDate,
}: {
  weeks: readonly Date[][];
  weekdays: readonly string[];
  mode: "month" | "week";
  /** Only used to fade days outside the shown month. */
  anchor: Date;
  byDate: ReadonlyMap<string, Workout[]>;
  barEvents: readonly BarEvent[];
  weather: Record<string, WeatherSnapshot>;
  onSelectDate: (iso: string) => void;
}) {
  return (
    // overflow-visible: Card defaults to overflow-hidden, which silently turns
    // the sticky weekday row below into a no-op.
    <Card className="overflow-visible p-2">
      {/* Sticks directly under the view picker (a derived token, see globals.css).
          It needs real padding and a rule underneath: with the labels flush to
          the bottom edge, a row scrolling under it gets sliced mid-glyph right
          against the text and reads as content bleeding through the header.
          Spans only the content width, so no negative margins are needed — the
          card's padding is never somewhere a day cell can reach. */}
      <div className="sticky top-(--stick-under-viewbar) z-(--z-sticky-sub) grid grid-cols-7 gap-1 border-b bg-card pb-2 pt-1">
        {weekdays.map((d) => (
          <div
            key={d}
            className="text-center text-[11px] font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="space-y-1">
        {weeks.map((week) => {
          const weekIsos = week.map(toISO);
          const bars = placeBars(weekIsos, barEvents);
          return (
            <div key={weekIsos[0]}>
              <div className="grid grid-cols-7 gap-1">
                {week.map((day, i) => {
                  const iso = weekIsos[i];
                  return (
                    <CalendarDayCell
                      key={iso}
                      date={day}
                      iso={iso}
                      // Flexible workouts render as bars, not in the cell.
                      workouts={(byDate.get(iso) ?? []).filter((w) => !w.flexible)}
                      weather={weather[iso]}
                      mode={mode}
                      // A week view is always "this week", so nothing fades.
                      dimmed={mode === "month" && !isSameMonth(day, anchor)}
                      onSelect={onSelectDate}
                    />
                  );
                })}
              </div>
              <CalendarBarTracks bars={bars} onSelectDate={onSelectDate} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
