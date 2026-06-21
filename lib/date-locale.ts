import type { Locale as DateFnsLocale } from "date-fns";
import { enUS } from "date-fns/locale";

// A tiny mutable holder so date formatters can localize without importing the
// (React-coupled) i18n instance. The I18nProvider keeps this in sync.
let current: DateFnsLocale = enUS;

export function setDateLocale(locale: DateFnsLocale): void {
  current = locale;
}

export function getDateLocale(): DateFnsLocale {
  return current;
}
