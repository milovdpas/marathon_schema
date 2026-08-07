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
import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useTrainingStore } from "@/store/use-training-store";

const THEMES = [
  { value: "light", key: "settings.themeLight" },
  { value: "dark", key: "settings.themeDark" },
  { value: "system", key: "settings.themeSystem" },
];

/** Theme and language. */
export function AppearanceCard() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const locale = useTrainingStore((s) => s.preferences.locale);
  const setPreferences = useTrainingStore((s) => s.setPreferences);

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
    </Card>
  );
}
