"use client";

import { enUS, nl } from "date-fns/locale";
import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { setDateLocale } from "@/lib/date-locale";
import i18n, { detectLocale } from "@/lib/i18n";
import { useTrainingStore } from "@/store/use-training-store";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useTrainingStore((s) => s.preferences.locale);
  const hydrated = useTrainingStore((s) => s.hydrated);
  const setPreferences = useTrainingStore((s) => s.setPreferences);

  // First-ever visit: pick up the browser language.
  useEffect(() => {
    if (hydrated && !locale) setPreferences({ locale: detectLocale() });
  }, [hydrated, locale, setPreferences]);

  const active = locale ?? "en";
  useEffect(() => {
    if (i18n.language !== active) void i18n.changeLanguage(active);
    setDateLocale(active === "nl" ? nl : enUS);
    if (typeof document !== "undefined") document.documentElement.lang = active;
  }, [active]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
