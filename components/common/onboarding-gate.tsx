"use client";

import { Cloud, CloudSun, ScanText, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { OnboardingStep } from "@/components/common/onboarding-step";
import { SplitsExample } from "@/components/common/splits-example";
import { enableWeather } from "@/lib/weather-sync";
import { useSyncStore } from "@/store/use-sync-store";
import { useTrainingStore } from "@/store/use-training-store";
import { useWeatherStore } from "@/store/use-weather-store";

/**
 * First-run prompts, shown one at a time in order: Drive, weather, split
 * scanning, then create-a-plan.
 *
 * Each step declares when it *applies*; the gate renders the first applicable
 * one from the cursor onward, and both buttons advance past it. That makes the
 * returning-user rule explicit rather than emergent: a user who finished
 * onboarding long ago has every first-run step marked inapplicable, so only
 * genuinely new prompts (currently: split scanning) reach them, once each.
 */
export function OnboardingGate() {
  const { t } = useTranslation();
  const router = useRouter();

  const hydrated = useTrainingStore((s) => s.hydrated);
  const onboardingSeen = useTrainingStore((s) => s.preferences.onboardingSeen);
  const weatherEnabled = useTrainingStore((s) => s.preferences.weatherEnabled);
  const splitsSeen = useTrainingStore(
    (s) => s.preferences.splitScannerOnboardingSeen,
  );
  const setPreferences = useTrainingStore((s) => s.setPreferences);
  const initializePlan = useTrainingStore((s) => s.initializePlan);

  const connect = useSyncStore((s) => s.connect);
  const driveConfigured = useSyncStore((s) => s.configured);
  const connected = useSyncStore((s) => s.connected);
  const driveReady = useSyncStore((s) => s.ready);
  const weatherConfigured = useWeatherStore((s) => s.configured);
  const weatherReady = useWeatherStore((s) => s.ready);

  const [cursor, setCursor] = useState(0);
  const advance = (from: number) => setCursor(from + 1);

  // Wait until we know whether Drive and weather are even available, or the
  // first render would decide a step doesn't apply and skip it for good.
  if (!hydrated || !driveReady || !weatherReady) return null;

  const firstRun = !onboardingSeen;

  const markSplitsSeen = (enable: boolean) =>
    setPreferences({
      splitScannerOnboardingSeen: true,
      ...(enable ? { splitScannerEnabled: true } : {}),
    });

  const finishOnboarding = () => setPreferences({ onboardingSeen: true });

  const steps: {
    key: string;
    applies: boolean;
    render: (next: () => void) => React.ReactNode;
  }[] = [
    {
      key: "drive",
      applies: firstRun && driveConfigured && !connected,
      render: (next) => (
        <OnboardingStep
          icon={Cloud}
          title={t("onboarding.driveTitle")}
          body={t("onboarding.driveBody")}
          skipLabel={t("onboarding.notNow")}
          confirmLabel={t("onboarding.connect")}
          onSkip={next}
          onConfirm={() => {
            void connect();
            next();
          }}
        />
      ),
    },
    {
      key: "weather",
      applies: firstRun && weatherConfigured && !weatherEnabled,
      render: (next) => (
        <OnboardingStep
          icon={CloudSun}
          title={t("onboarding.weatherTitle")}
          body={t("onboarding.weatherBody")}
          skipLabel={t("onboarding.notNow")}
          confirmLabel={t("onboarding.enableWeather")}
          onSkip={next}
          onConfirm={() => {
            void (async () => {
              const result = await enableWeather();
              // Default the calendar display on for a good first impression.
              setPreferences(
                result === "ok"
                  ? { weatherOnboardingSeen: true, weatherCalendar: true }
                  : { weatherOnboardingSeen: true },
              );
            })();
            next();
          }}
        />
      ),
    },
    {
      // The only step that also reaches returning users — it postdates their
      // onboarding, so it's shown standalone, once.
      key: "splits",
      applies: !splitsSeen,
      render: (next) => (
        <OnboardingStep
          icon={ScanText}
          title={t("onboarding.splitsTitle")}
          body={t("onboarding.splitsBody")}
          skipLabel={t("onboarding.notNow")}
          confirmLabel={t("onboarding.enableSplits")}
          className="max-h-[90dvh] overflow-y-auto"
          onSkip={() => {
            markSplitsSeen(false);
            next();
          }}
          onConfirm={() => {
            markSplitsSeen(true);
            next();
          }}
        >
          <SplitsExample />
        </OnboardingStep>
      ),
    },
    {
      key: "plan",
      applies: firstRun,
      render: (next) => (
        <OnboardingStep
          icon={Sparkles}
          title={t("onboarding.planTitle")}
          body={t("onboarding.planBody")}
          skipLabel={t("onboarding.lookAround")}
          confirmLabel={t("onboarding.createPlan")}
          onSkip={() => {
            finishOnboarding();
            void initializePlan(); // seeds the example plan
            next();
          }}
          onConfirm={() => {
            finishOnboarding();
            router.push("/plan/new");
            next();
          }}
        />
      ),
    },
  ];

  const i = steps.findIndex((s, idx) => idx >= cursor && s.applies);
  if (i === -1) return null;
  return steps[i].render(() => advance(i));
}
