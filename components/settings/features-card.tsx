"use client";

import { useTranslation } from "react-i18next";
import { SplitScannerCard } from "@/components/settings/split-scanner-card";
import { WeatherCard } from "@/components/settings/weather-card";

/**
 * The opt-in features, grouped under one heading.
 *
 * A section rather than a `<Card>`: each feature is already its own card with
 * its own toggle and explanation, and nesting cards would double the borders.
 * The heading is what makes "these are optional" legible.
 */
export function FeaturesCard() {
  const { t } = useTranslation();

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{t("features.title")}</h3>
        <p className="text-xs text-muted-foreground">{t("features.subtitle")}</p>
      </div>
      <WeatherCard />
      <SplitScannerCard />
    </section>
  );
}
