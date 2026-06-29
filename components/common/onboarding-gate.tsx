"use client";

import { Cloud, CloudSun, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { enableWeather } from "@/lib/weather-sync";
import { useSyncStore } from "@/store/use-sync-store";
import { useTrainingStore } from "@/store/use-training-store";
import { useWeatherStore } from "@/store/use-weather-store";

export function OnboardingGate() {
  const { t } = useTranslation();
  const router = useRouter();
  const hydrated = useTrainingStore((s) => s.hydrated);
  const onboardingSeen = useTrainingStore((s) => s.preferences.onboardingSeen);
  const setPreferences = useTrainingStore((s) => s.setPreferences);
  const initializePlan = useTrainingStore((s) => s.initializePlan);
  const connect = useSyncStore((s) => s.connect);
  const configured = useSyncStore((s) => s.configured);
  const connected = useSyncStore((s) => s.connected);
  const ready = useSyncStore((s) => s.ready);
  const weatherConfigured = useWeatherStore((s) => s.configured);
  const weatherReady = useWeatherStore((s) => s.ready);
  const weatherEnabled = useTrainingStore((s) => s.preferences.weatherEnabled);

  // Ask about Drive, then Weather, then creating a plan.
  const [phase, setPhase] = useState<"drive" | "weather" | "plan">("drive");

  if (!hydrated || onboardingSeen || !ready || !weatherReady) return null;

  const driveApplicable = configured && !connected;
  const weatherApplicable = weatherConfigured && !weatherEnabled;

  const handleEnableWeather = async () => {
    const result = await enableWeather();
    // Default the calendar display on for a good first impression.
    setPreferences(
      result === "ok"
        ? { weatherOnboardingSeen: true, weatherCalendar: true }
        : { weatherOnboardingSeen: true },
    );
    setPhase("plan");
  };

  const lookAround = () => {
    setPreferences({ onboardingSeen: true });
    initializePlan(); // seeds the example plan now that onboarding is done
  };

  const createPlan = () => {
    setPreferences({ onboardingSeen: true });
    router.push("/plan/new");
  };

  if (phase === "drive" && driveApplicable) {
    return (
      <Dialog open onOpenChange={() => setPhase("weather")}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cloud className="size-5 text-primary" /> {t("onboarding.driveTitle")}
            </DialogTitle>
            <DialogDescription>{t("onboarding.driveBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setPhase("weather")}>
              {t("onboarding.notNow")}
            </Button>
            <Button
              onClick={() => {
                void connect();
                setPhase("weather");
              }}
            >
              <Cloud className="size-4" /> {t("onboarding.connect")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (phase !== "plan" && weatherApplicable) {
    return (
      <Dialog open onOpenChange={() => setPhase("plan")}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CloudSun className="size-5 text-primary" />{" "}
              {t("onboarding.weatherTitle")}
            </DialogTitle>
            <DialogDescription>{t("onboarding.weatherBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setPhase("plan")}>
              {t("onboarding.notNow")}
            </Button>
            <Button onClick={() => void handleEnableWeather()}>
              <CloudSun className="size-4" /> {t("onboarding.enableWeather")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && lookAround()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" /> {t("onboarding.planTitle")}
          </DialogTitle>
          <DialogDescription>{t("onboarding.planBody")}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" onClick={lookAround}>
            {t("onboarding.lookAround")}
          </Button>
          <Button onClick={createPlan}>
            <Sparkles className="size-4" /> {t("onboarding.createPlan")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
