// Laying multi-day periods out as spanning bars across a calendar week.
//
// Off days and flexible workouts both cover a range rather than a single day,
// so they render as bars above the day cells. Overlapping bars are packed into
// as few rows ("tracks") as possible.

import type { OffDay, Workout, WorkoutType } from "@/lib/types";

/** A multi-day period rendered as a spanning bar (off day or flexible workout). */
export interface BarEvent {
  key: string;
  start: string; // ISO
  end: string; // ISO (inclusive)
  label: string;
  kind: "off" | "flex";
  type?: WorkoutType; // for flex bars (color)
  chosenDate?: string; // for flex bars (highlighted day)
}

export interface PlacedBar {
  ev: BarEvent;
  startCol: number;
  span: number;
  startIso: string;
  continuesLeft: boolean;
  continuesRight: boolean;
  chosenOffset?: number; // column within the bar that's currently planned
  track: number;
}

/** Everything in a plan that spans days: off-day periods and flexible windows. */
export function buildBarEvents(
  offDays: readonly OffDay[],
  workouts: readonly Workout[],
): BarEvent[] {
  return [
    ...offDays.map((o) => ({
      key: `off-${o.id}`,
      start: o.start,
      end: o.end,
      label: o.title,
      kind: "off" as const,
    })),
    ...workouts
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
}

/**
 * Lay periods out into non-overlapping tracks for a single week.
 *
 * `weekIsos` must be exactly 7 Monday-first ISO dates. Bars are clipped to the
 * week, and `continuesLeft`/`continuesRight` say whether they run past its edge
 * so the caller can square off the corresponding corner.
 */
export function placeBars(
  weekIsos: readonly string[],
  events: readonly BarEvent[],
): PlacedBar[] {
  const weekStart = weekIsos[0];
  const weekEnd = weekIsos[6];
  const trackEnds: number[] = [];
  const out: PlacedBar[] = [];

  // Sorting a filtered copy, never `events` itself: this is called with a prop
  // and sorting in place would be a mutation.
  const inWeek = events
    .filter((e) => e.start <= weekEnd && e.end >= weekStart)
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));

  for (const ev of inWeek) {
    const segStart = ev.start < weekStart ? weekStart : ev.start;
    const segEnd = ev.end > weekEnd ? weekEnd : ev.end;
    const startCol = weekIsos.indexOf(segStart);
    const endCol = weekIsos.indexOf(segEnd);
    if (startCol < 0 || endCol < 0) continue;

    // First track whose last bar ends before this one starts, else a new one.
    let track = trackEnds.findIndex((end) => end < startCol);
    if (track === -1) track = trackEnds.length;
    trackEnds[track] = endCol;

    let chosenOffset: number | undefined;
    if (ev.kind === "flex" && ev.chosenDate) {
      const ci = weekIsos.indexOf(ev.chosenDate);
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

/** How many track rows `bars` needs. */
export function trackCount(bars: readonly PlacedBar[]): number {
  return bars.reduce((m, b) => Math.max(m, b.track + 1), 0);
}
