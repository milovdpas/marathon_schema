"use client";

import { format } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { stepAnchor, visibleDays } from "@/lib/calendar/range";
import { chunkWeeks, formatRange, toISO } from "@/lib/date";
import { dateLocaleFor } from "@/lib/date-locale";
import type { CalendarViewMode } from "@/lib/types";
import { useTrainingStore } from "@/store/use-training-store";

/**
 * The chosen view, persisted so navigating away and back keeps it.
 *
 * Until the user picks one, the default depends on the device: the scrolling
 * agenda reads best on a phone, the month grid on a wide screen. Reading
 * `window` in the `useState` initializer is safe because `HydrationGate` means
 * this only ever mounts client-side.
 */
export function useCalendarViewMode(): [
  CalendarViewMode,
  (v: CalendarViewMode) => void,
] {
  const saved = useTrainingStore((s) => s.preferences.calendarView);
  const setPreferences = useTrainingStore((s) => s.setPreferences);
  const [deviceDefault] = useState<CalendarViewMode>(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 768px)").matches
      ? "month"
      : "agenda",
  );
  const setView = useCallback(
    (v: CalendarViewMode) => setPreferences({ calendarView: v }),
    [setPreferences],
  );
  return [saved ?? deviceDefault, setView];
}

export interface CalendarRange {
  anchor: Date;
  /** Whole, Monday-aligned weeks. */
  days: Date[];
  weeks: Date[][];
  /** Heading for the current range, e.g. "August 2026" or "3–9 Aug". */
  rangeTitle: string;
  /** False for agenda, which spans the whole plan and has nothing to step. */
  paged: boolean;
  goToday: () => void;
  goPrev: () => void;
  goNext: () => void;
}

/** Where the calendar is pointing, and how to move it. */
export function useCalendarRange(view: CalendarViewMode): CalendarRange {
  const { t, i18n } = useTranslation();
  const [anchor, setAnchor] = useState(() => new Date());

  const days = useMemo(() => visibleDays(view, anchor), [view, anchor]);
  const weeks = useMemo(() => chunkWeeks(days), [days]);

  const locale = dateLocaleFor(i18n.language);
  const rangeTitle = useMemo(() => {
    if (view === "month") return format(anchor, "MMMM yyyy", { locale });
    if (view === "week") return formatRange(toISO(days[0]), toISO(days[6]));
    if (view === "day") return format(anchor, "EEEE d MMMM", { locale });
    return t("calendar.viewAgenda");
    // `formatRange` reads the module-level locale, so it needs `locale` too.
  }, [view, anchor, days, locale, t]);

  return {
    anchor,
    days,
    weeks,
    rangeTitle,
    paged: view !== "agenda",
    goToday: useCallback(() => setAnchor(new Date()), []),
    goPrev: useCallback(() => setAnchor((d) => stepAnchor(view, d, -1)), [view]),
    goNext: useCallback(() => setAnchor((d) => stepAnchor(view, d, 1)), [view]),
  };
}
