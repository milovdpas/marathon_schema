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
import { formatClock, formatPace, resolveLoggedRun } from "@/lib/pace";
import type { Workout, WorkoutSplit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SplitScanField } from "@/components/common/split-scan-field";
import { TimeField } from "@/components/common/time-field";
import { attachWeather } from "@/lib/weather-sync";
import { useTrainingStore } from "@/store/use-training-store";

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
  const [splits, setSplits] = useState<WorkoutSplit[]>([]);

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
    setSplits(workout.splits ?? []);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  // distance + (duration OR pace) computes & locks the third field. The same
  // call drives what is displayed and what is saved, so they cannot disagree.
  const resolved = resolveLoggedRun({ distance, duration, pace });
  const paceComputed = resolved.computed === "pace";
  const durationComputed = resolved.computed === "duration";
  const { paceFieldValue, durationFieldValue } = resolved;

  const handleConfirm = () => {
    if (!workout) return;
    const { actualDistanceKm, durationMin, actualPace } = resolved;
    const start = startTime.trim() || undefined;
    updateWorkout(workout.id, {
      actualDistanceKm,
      durationMin,
      actualPace,
      startTime: start,
      splits: splits.length > 0 ? splits : undefined,
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

            <SplitScanField splits={splits} onChange={setSplits} />
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
