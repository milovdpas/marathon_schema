"use client";

import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUnits } from "@/hooks/use-units";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n";
import { countryName, unitsForCountry } from "@/lib/region";
import { cn } from "@/lib/utils";
import { useTrainingStore } from "@/store/use-training-store";

const THEMES = [
  { value: "light", key: "settings.themeLight" },
  { value: "dark", key: "settings.themeDark" },
  { value: "system", key: "settings.themeSystem" },
];

/**
 * The countries offered explicitly. Deliberately short rather than all ~250:
 * the field exists to default your units and tell the AI roughly where you
 * race, not to be a census. A detected country outside this list is kept and
 * shown regardless — it just isn't in the dropdown.
 */
const COMMON_COUNTRIES = [
  "NL", "BE", "DE", "FR", "GB", "IE", "ES", "IT", "PT", "AT", "CH",
  "DK", "SE", "NO", "FI", "PL", "CZ",
  "US", "CA", "AU", "NZ", "ZA", "JP", "BR",
];

/**
 * Everything about how the app presents itself: theme, language, country and
 * units. These were two cards; they answer the same question ("how should this
 * look to me?") and splitting them meant scrolling past three unrelated cards
 * to change two settings people change together.
 */
export function AppearanceCard() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const locale = useTrainingStore((s) => s.preferences.locale);
  const country = useTrainingStore((s) => s.preferences.country);
  const explicitUnits = useTrainingStore((s) => s.preferences.units);
  const setPreferences = useTrainingStore((s) => s.setPreferences);
  const units = useUnits();

  // A detected country we don't list still belongs in the dropdown, or opening
  // it would silently reset the user to "not set".
  const countryOptions =
    country && !COMMON_COUNTRIES.includes(country)
      ? [country, ...COMMON_COUNTRIES]
      : COMMON_COUNTRIES;

  return (
    <Card className="gap-0 p-4">
      <h3 className="mb-3 text-sm font-semibold">{t("settings.appearance")}</h3>

      <div className="grid grid-cols-3 gap-2">
        {THEMES.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            className={cn(
              "rounded-lg border py-2 text-sm font-medium transition-colors",
              theme === opt.value
                ? "border-primary bg-primary/10 text-primary"
                : "hover:bg-accent",
            )}
          >
            {t(opt.key)}
          </button>
        ))}
      </div>

      <Label className="mb-1.5 mt-4 block text-xs text-muted-foreground">
        {t("units.country")}
      </Label>
      <Select
        value={country ?? ""}
        onValueChange={(v) => setPreferences({ country: (v as string) || undefined })}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            {(value) =>
              value
                ? countryName(value as string, i18n.language)
                : t("units.countryUnset")
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {countryOptions.map((c) => (
            <SelectItem key={c} value={c}>
              {countryName(c, i18n.language)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Label className="mb-1.5 mt-4 block text-xs text-muted-foreground">
        {t("settings.language")}
      </Label>
      <Select
        value={locale ?? "en"}
        onValueChange={(v) => setPreferences({ locale: v as Locale })}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            {(value) => LOCALE_LABELS[(value as Locale) ?? "en"]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {LOCALES.map((l) => (
            <SelectItem key={l} value={l}>
              {LOCALE_LABELS[l]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Label className="mb-1.5 mt-4 block text-xs text-muted-foreground">
        {t("units.measure")}
      </Label>
      <div className="grid grid-cols-2 gap-2">
        {(["metric", "imperial"] as const).map((u) => (
          <button
            key={u}
            type="button"
            aria-pressed={units === u}
            onClick={() => setPreferences({ units: u })}
            className={cn(
              "rounded-lg border py-2 text-sm font-medium transition-colors",
              units === u
                ? "border-primary bg-primary/10 text-primary"
                : "hover:bg-accent",
            )}
          >
            {t(`units.${u}`)}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {explicitUnits
          ? t("units.explicit", { country: t(`units.${unitsForCountry(country)}`) })
          : t("units.followsCountry")}{" "}
        {t("units.storedNote")}
      </p>
    </Card>
  );
}
