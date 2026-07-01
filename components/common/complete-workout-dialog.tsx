"use client";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatClock,
  formatPace,
  paceFromDistanceDuration,
  paceToSeconds,
  parseDurationToMinutes,
} from "@/lib/pace";
import type { Workout } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TimeField } from "@/components/common/time-field";
import { attachWeather } from "@/lib/weather-sync";
import { useTrainingStore } from "@/store/use-training-store";

function num(v: string): number | undefined {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Quick "I finished this run" flow: prefills the planned distance + pace so the
 * user can tweak what they actually ran in one tap, then logs & completes.
 */
export function CompleteWorkoutDialog({
  workout,
  open,
  onOpenChange,
}: {
  workout: Workout | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const updateWorkout = useTrainingStore((s) => s.updateWorkout);

  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [pace, setPace] = useState("");
  const [startTime, setStartTime] = useState("");

  // Prefill from the planned target when the dialog opens (reset during render).
  const [wasOpen, setWasOpen] = useState(false);
  if (open && workout && !wasOpen) {
    setWasOpen(true);
    setDistance(
      String(workout.actualDistanceKm ?? workout.plannedDistanceKm ?? ""),
    );
    setPace(workout.actualPace ?? workout.plannedPace ?? "");
    setDuration(formatClock(workout.durationMin));
    setStartTime(workout.startTime ?? "");
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  // distance + (duration OR pace) computes & locks the third field.
  const d = num(distance);
  const durMin = parseDurationToMinutes(duration);
  const paceSecs = paceToSeconds(pace);
  const hasDuration = duration.trim() !== "" && durMin != null;
  const hasPace = pace.trim() !== "" && paceSecs != null;
  const paceComputed = !!d && hasDuration;
  const durationComputed = !!d && !hasDuration && hasPace;
  const paceFieldValue = paceComputed
    ? (paceFromDistanceDuration(d, durMin ?? undefined) ?? "")
    : pace;
  const durationFieldValue = durationComputed
    ? formatClock(((paceSecs ?? 0) * (d ?? 0)) / 60)
    : duration;

  const handleConfirm = () => {
    if (!workout) return;
    const actualDistanceKm = num(distance);
    let durationMin = parseDurationToMinutes(duration);
    let actualPace = pace.trim() || undefined;
    if (actualDistanceKm) {
      if (durationMin != null) {
        actualPace =
          paceFromDistanceDuration(actualDistanceKm, durationMin) ?? actualPace;
      } else if (actualPace) {
        const ps = paceToSeconds(actualPace);
        if (ps != null) durationMin = (ps * actualDistanceKm) / 60;
      }
    }
    const start = startTime.trim() || undefined;
    updateWorkout(workout.id, {
      actualDistanceKm,
      durationMin,
      actualPace,
      startTime: start,
      completed: true,
    });
    void attachWeather(workout.id, workout.date, start);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{workout?.title || t("completeWorkout.title")}</DialogTitle>
          <DialogDescription>{t("completeWorkout.desc")}</DialogDescription>
        </DialogHeader>

        {workout ? (
          <div className="grid gap-4 py-1">
            <p className="text-xs text-muted-foreground">
              {t("completeWorkout.planned", {
                km: workout.plannedDistanceKm,
                pace: formatPace(workout.plannedPace).replace("/km", ""),
              })}
            </p>

            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("workoutForm.distanceKm")}
              </Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">
                  {t("workoutForm.durationMin")}
                </Label>
                <Input
                  inputMode="text"
                  placeholder="mm:ss"
                  readOnly={durationComputed}
                  aria-readonly={durationComputed}
                  className={cn(
                    durationComputed && "bg-muted text-muted-foreground",
                  )}
                  value={durationFieldValue}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">
                  {t("workoutForm.paceLabel")}
                </Label>
                <Input
                  placeholder="4:58"
                  readOnly={paceComputed}
                  aria-readonly={paceComputed}
                  className={cn(paceComputed && "bg-muted text-muted-foreground")}
                  value={paceFieldValue}
                  onChange={(e) => setPace(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("workoutForm.computeHint")}
            </p>

            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("workoutForm.startTime")}
              </Label>
              <TimeField value={startTime} onChange={setStartTime} />
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleConfirm}>{t("completeWorkout.confirm")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
