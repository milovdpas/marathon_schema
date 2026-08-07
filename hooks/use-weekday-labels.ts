"use client";

import { addDays, format, startOfWeek } from "date-fns";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { dateLocaleFor } from "@/lib/date-locale";

// Any Monday; only the weekday names are read off it.
const A_MONDAY = startOfWeek(new Date(2024, 0, 1), { weekStartsOn: 1 });

/** Localized Mon–Sun short weekday headers, e.g. ["Mon", "Tue", …]. */
export function useWeekdayLabels(): string[] {
  const { i18n } = useTranslation();
  const locale = dateLocaleFor(i18n.language);
  return useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        format(addDays(A_MONDAY, i), "EEE", { locale }),
      ),
    [locale],
  );
}
