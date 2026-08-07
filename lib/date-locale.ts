import type { Locale as DateFnsLocale } from "date-fns";
import { enUS, nl } from "date-fns/locale";

/**
 * The date-fns locale for a language tag. Pure, so a React memo can depend on
 * the tag directly instead of using it as a proxy for the mutable module
 * global below (which is what forced the exhaustive-deps suppressions).
 */
export function dateLocaleFor(lang: string | undefined): DateFnsLocale {
  return lang?.startsWith("nl") ? nl : enUS;
}

// A tiny mutable holder so date formatters can localize without importing the
// (React-coupled) i18n instance. The I18nProvider keeps this in sync.
let current: DateFnsLocale = enUS;

export function setDateLocale(locale: DateFnsLocale): void {
  current = locale;
}

/** For non-React callers. Inside a component, prefer `dateLocaleFor(lang)`. */
export function getDateLocale(): DateFnsLocale {
  return current;
}
