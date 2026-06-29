"use client";

import { AlertCircle, CloudSun } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useMounted } from "@/hooks/use-mounted";
import { enableWeather } from "@/lib/weather-sync";
import { useTrainingStore } from "@/store/use-training-store";
import { useWeatherStore } from "@/store/use-weather-store";

export function WeatherCard() {
  const { t } = useTranslation();
  const configured = useWeatherStore((s) => s.configured);
  const ready = useWeatherStore((s) => s.ready);
  const weatherEnabled = useTrainingStore((s) => s.preferences.weatherEnabled);
  const setPreferences = useTrainingStore((s) => s.setPreferences);

  const mounted = useMounted();
  const [locError, setLocError] = useState<"denied" | "unavailable" | null>(null);
  const [busy, setBusy] = useState(false);

  const loading = !mounted || !ready;

  const toggleEnabled = async (on: boolean) => {
    if (!on) {
      setPreferences({ weatherEnabled: false });
      return;
    }
    setBusy(true);
    setLocError(null);
    const result = await enableWeather();
    setBusy(false);
    if (result !== "ok") setLocError(result);
  };

  return (
    <Card className="gap-0 p-4">
      <div className="mb-1 flex items-center gap-2">
        <CloudSun className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{t("weather.title")}</h3>
      </div>

      {loading ? (
        <div className="mt-2 h-9 w-40 animate-pulse rounded-md bg-muted" />
      ) : !configured ? (
        <p className="text-xs text-muted-foreground">{t("weather.notConfigured")}</p>
      ) : (
        <div className="mt-2 space-y-3">
          <label className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
            <span className="min-w-0">
              <span className="block text-sm font-medium">{t("weather.enable")}</span>
              <span className="block text-xs text-muted-foreground">
                {t("weather.enableBody")}
              </span>
            </span>
            <Switch
              checked={!!weatherEnabled}
              disabled={busy}
              onCheckedChange={(v) => void toggleEnabled(v)}
            />
          </label>

          {locError ? (
            <p className="flex items-start gap-1.5 text-xs text-destructive">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              {locError === "denied"
                ? t("weather.locationDenied")
                : t("weather.locationUnavailable")}
            </p>
          ) : null}
        </div>
      )}
    </Card>
  );
}
