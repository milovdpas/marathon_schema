import {
  differenceInCalendarDays,
  format,
  isWithinInterval,
  parseISO,
} from "date-fns";
import { getDateLocale } from "./date-locale";
import type { OffDay } from "./types";

/** Canonical ISO (yyyy-mm-dd) string for a Date, in local time. */
export function toISO(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Parse a yyyy-mm-dd string as a local Date (midnight). */
export function fromISO(iso: string): Date {
  return parseISO(iso);
}

/** Today as a yyyy-mm-dd string (local). */
export function todayISO(): string {
  return toISO(new Date());
}

/** Whole calendar days from today until the given ISO date (negative if past). */
export function daysUntil(iso: string): number {
  return differenceInCalendarDays(parseISO(iso), startOfToday());
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Human label like "Mon 22 Jun". */
export function formatDayLabel(iso: string): string {
  return format(parseISO(iso), "EEE d MMM", { locale: getDateLocale() });
}

/** Human range like "22–28 Jun" / "29 Jun – 5 Jul". */
export function formatRange(startISO: string, endISO: string): string {
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  const locale = getDateLocale();
  const sameMonth = s.getMonth() === e.getMonth();
  return sameMonth
    ? `${format(s, "d")}–${format(e, "d MMM", { locale })}`
    : `${format(s, "d MMM", { locale })} – ${format(e, "d MMM", { locale })}`;
}

export interface SpecialPeriod {
  start: string; // ISO
  end: string; // ISO (inclusive)
  label: string;
  /** How much training is affected. */
  severity: "none" | "limited" | "reduced";
}

// Encoded once here so the plan generator can apply them automatically and
// they remain easy to edit in one place.
export const SPECIAL_PERIODS: SpecialPeriod[] = [
  {
    // 1/8 triathlon on the 20th — Sunday's long run becomes a short,
    // optional recovery jog (and it'll be hot).
    start: "2026-06-20",
    end: "2026-06-21",
    label: "Triathlon recovery",
    severity: "limited",
  },
  {
    start: "2026-07-03",
    end: "2026-07-05",
    label: "Vacation",
    severity: "none",
  },
  {
    start: "2026-07-24",
    end: "2026-08-02",
    label: "Surf trip",
    severity: "limited",
  },
  {
    start: "2026-09-16",
    end: "2026-09-23",
    label: "Vacation",
    severity: "reduced",
  },
];

/** The off-day period covering a given ISO date, if any. */
export function offDayForDate(
  offDays: OffDay[] | undefined,
  iso: string,
): OffDay | undefined {
  if (!offDays) return undefined;
  return offDays.find((o) => iso >= o.start && iso <= o.end);
}

/** The special period covering a given ISO date, if any. */
export function specialPeriodFor(iso: string): SpecialPeriod | undefined {
  const d = parseISO(iso);
  return SPECIAL_PERIODS.find((p) =>
    isWithinInterval(d, { start: parseISO(p.start), end: parseISO(p.end) }),
  );
}

/** Does [startISO, endISO] overlap any special period? Returns it if so. */
export function overlappingSpecialPeriod(
  startISO: string,
  endISO: string,
): SpecialPeriod | undefined {
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  return SPECIAL_PERIODS.find((p) => {
    const ps = parseISO(p.start);
    const pe = parseISO(p.end);
    return ps <= e && pe >= s; // intervals overlap
  });
}
