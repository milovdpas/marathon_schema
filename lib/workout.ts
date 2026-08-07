// Small shared predicates and indexes over a plan's workouts.

import { eachDayOfInterval } from "date-fns";
import { fromISO, toISO } from "./date";
import type { Workout } from "./types";

/**
 * A workout the user has actually run. Note `actualDistanceKm: 0` counts as
 * logged: `0 != null` is true, and someone who recorded a zero-distance session
 * did record something. Several call sites depend on this exact predicate to
 * decide what survives a re-import, so don't "tidy" it into a truthiness check.
 */
export function isLogged(w: Workout): boolean {
  return w.completed || w.actualDistanceKm != null;
}

/** Workouts keyed by the ISO date they're scheduled on. */
export function groupByDate(
  workouts: Iterable<Workout>,
): Map<string, Workout[]> {
  const map = new Map<string, Workout[]>();
  for (const w of workouts) {
    const list = map.get(w.date) ?? [];
    list.push(w);
    map.set(w.date, list);
  }
  return map;
}

/**
 * Every ISO day inside a flexible workout's window, mapped to the workouts
 * choosable that day. Lets the calendar offer "move it here" on any day of the
 * window, not just the one it's currently planned on.
 */
export function flexibleWindowIndex(
  workouts: Iterable<Workout>,
): Map<string, Workout[]> {
  const map = new Map<string, Workout[]>();
  for (const w of workouts) {
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
  return map;
}
