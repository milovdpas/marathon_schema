"use client";

import { Cloud, CloudSun, ScanText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { useSyncStore } from "@/store/use-sync-store";
import { useWeatherStore } from "@/store/use-weather-store";

/** The opt-ins the user chose in the flow. Applied on finish, not here. */
export interface FeatureChoices {
  drive: boolean;
  weather: boolean;
  splits: boolean;
}

export const NO_FEATURES: FeatureChoices = {
  drive: false,
  weather: false,
  splits: false,
};

function Toggle({
  icon: Icon,
  title,
  body,
  checked,
  onChange,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{body}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

/**
 * Everything optional, in one place, all off by default.
 *
 * Nothing here takes effect yet — these are local answers the flow applies on
 * finish. Connecting Drive in particular *cannot* happen here: it's a full-page
 * redirect to Google, which would throw away the rest of the flow.
 */
export function StepFeatures({
  value,
  onChange,
}: {
  value: FeatureChoices;
  onChange: (next: FeatureChoices) => void;
}) {
  const { t } = useTranslation();
  const driveConfigured = useSyncStore((s) => s.configured);
  const weatherConfigured = useWeatherStore((s) => s.configured);

  const set = (patch: Partial<FeatureChoices>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="space-y-3">
      {driveConfigured ? (
        <Toggle
          icon={Cloud}
          title={t("onboarding.driveTitle")}
          body={t("onboarding.driveBody")}
          checked={value.drive}
          onChange={(drive) => set({ drive })}
        />
      ) : null}

      {weatherConfigured ? (
        <Toggle
          icon={CloudSun}
          title={t("onboarding.weatherTitle")}
          body={t("onboarding.weatherBody")}
          checked={value.weather}
          onChange={(weather) => set({ weather })}
        />
      ) : null}

      <Toggle
        icon={ScanText}
        title={t("onboarding.splitsTitle")}
        body={t("onboarding.splitsBody")}
        checked={value.splits}
        onChange={(splits) => set({ splits })}
      />
    </div>
  );
}
