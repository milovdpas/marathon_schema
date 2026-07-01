"use client";

import { Trash2 } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TimeField } from "@/components/common/time-field";
import {
  formatClock,
  paceFromDistanceDuration,
  paceToSeconds,
  parseDurationToMinutes,
} from "@/lib/pace";
import { WORKOUT_TYPES, type Workout, type WorkoutType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { attachWeather } from "@/lib/weather-sync";
import { useTrainingStore } from "@/store/use-training-store";

interface FormState {
  date: string;
  type: WorkoutType;
  title: string;
  plannedDistanceKm: string;
  plannedPace: string;
  actualDistanceKm: string;
  durationMin: string;
  actualPace: string;
  startTime: string;
  notes: string;
  completed: boolean;
  flexible: boolean;
  windowStart: string;
  windowEnd: string;
}

function blankForm(defaultDate: string): FormState {
  return {
    date: defaultDate,
    type: "easy",
    title: "",
    plannedDistanceKm: "",
    plannedPace: "",
    actualDistanceKm: "",
    durationMin: "",
    actualPace: "",
    startTime: "",
    notes: "",
    completed: false,
    flexible: false,
    windowStart: "",
    windowEnd: "",
  };
}

function fromWorkout(w: Workout): FormState {
  return {
    date: w.date,
    type: w.type,
    title: w.title,
    plannedDistanceKm: String(w.plannedDistanceKm ?? ""),
    plannedPace: w.plannedPace ?? "",
    actualDistanceKm: w.actualDistanceKm != null ? String(w.actualDistanceKm) : "",
    durationMin: formatClock(w.durationMin),
    actualPace: w.actualPace ?? "",
    startTime: w.startTime ?? "",
    notes: w.notes ?? "",
    completed: w.completed,
    flexible: w.flexible ?? false,
    windowStart: w.windowStart ?? "",
    windowEnd: w.windowEnd ?? "",
  };
}

function num(v: string): number | undefined {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : undefined;
}

export function WorkoutFormDialog({
  open,
  onOpenChange,
  workout,
  defaultDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout?: Workout | null;
  defaultDate?: string;
}) {
  const { t } = useTranslation();
  const updateWorkout = useTrainingStore((s) => s.updateWorkout);
  const addWorkout = useTrainingStore((s) => s.addWorkout);
  const deleteWorkout = useTrainingStore((s) => s.deleteWorkout);

  const isEdit = !!workout;
  const [form, setForm] = useState<FormState>(blankForm(defaultDate ?? ""));
  // "plan" = schedule a future workout; "log" = record one you've done.
  const [mode, setMode] = useState<"plan" | "log">("plan");

  // Reset the form to the target workout whenever the dialog opens (adjusting
  // state during render — the recommended alternative to a reset-in-effect).
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setForm(workout ? fromWorkout(workout) : blankForm(defaultDate ?? ""));
    setMode(workout?.completed ? "log" : "plan");
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Log mode: distance + (duration OR pace) computes & locks the third field.
  const logDistance = num(form.actualDistanceKm);
  const logDurationMin = parseDurationToMinutes(form.durationMin);
  const logPaceSecs = paceToSeconds(form.actualPace);
  const hasDuration = form.durationMin.trim() !== "" && logDurationMin != null;
  const hasPace = form.actualPace.trim() !== "" && logPaceSecs != null;
  const paceComputed = !!logDistance && hasDuration;
  const durationComputed = !!logDistance && !hasDuration && hasPace;
  const paceFieldValue = paceComputed
    ? (paceFromDistanceDuration(logDistance, logDurationMin ?? undefined) ?? "")
    : form.actualPace;
  const durationFieldValue = durationComputed
    ? formatClock(((logPaceSecs ?? 0) * (logDistance ?? 0)) / 60)
    : form.durationMin;

  const handleSave = () => {
    const title = form.title.trim() || t(`workoutType.${form.type}`);
    let payload: Partial<Workout> & { type: Workout["type"]; date: string };

    if (mode === "log") {
      // Logging something you did: record the actuals, mark it complete.
      const actualDistanceKm = num(form.actualDistanceKm);
      let durationMin = parseDurationToMinutes(form.durationMin);
      let actualPace = form.actualPace.trim() || undefined;
      // Fill in whichever of duration/pace is missing from the other two.
      if (actualDistanceKm) {
        if (durationMin != null) {
          actualPace =
            paceFromDistanceDuration(actualDistanceKm, durationMin) ?? actualPace;
        } else if (actualPace) {
          const ps = paceToSeconds(actualPace);
          if (ps != null) durationMin = (ps * actualDistanceKm) / 60;
        }
      }
      payload = {
        date: form.date,
        type: form.type,
        title,
        actualDistanceKm,
        durationMin,
        actualPace,
        startTime: form.startTime.trim() || undefined,
        notes: form.notes.trim() || undefined,
        completed: form.completed,
        // A logged activity has a concrete date.
        flexible: undefined,
        windowStart: undefined,
        windowEnd: undefined,
      };
    } else {
      // Planning a workout: only planned targets + scheduling.
      const flexible = form.flexible;
      payload = {
        date: flexible ? form.windowStart || form.date : form.date,
        type: form.type,
        title,
        plannedDistanceKm: num(form.plannedDistanceKm) ?? 0,
        plannedPace: form.plannedPace.trim() || undefined,
        completed: false,
        flexible: flexible || undefined,
        windowStart: flexible ? form.windowStart || undefined : undefined,
        windowEnd: flexible ? form.windowEnd || undefined : undefined,
      };
    }

    let targetId: string;
    if (isEdit && workout) {
      updateWorkout(workout.id, payload);
      targetId = workout.id;
    } else {
      targetId = addWorkout(payload as Parameters<typeof addWorkout>[0]);
    }
    if (mode === "log") {
      void attachWeather(targetId, payload.date, form.startTime.trim() || undefined);
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (workout) deleteWorkout(workout.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("workoutForm.editTitle") : t("workoutForm.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("workoutForm.editDesc") : t("workoutForm.addDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          {/* Mode: plan a future workout vs. log one you've done */}
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(["plan", "log"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  if (m === "log" && !form.completed) set("completed", true);
                }}
                className={cn(
                  "rounded-md py-1.5 text-sm font-medium transition-colors",
                  mode === m
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "plan" ? t("workoutForm.modePlan") : t("workoutForm.modeLog")}
              </button>
            ))}
          </div>

          <Field label={t("workoutForm.type")}>
            <Select
              value={form.type}
              onValueChange={(v) => set("type", v as WorkoutType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORKOUT_TYPES.map((ty) => (
                  <SelectItem key={ty} value={ty}>
                    {t(`workoutType.${ty}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label={t("workoutForm.titleLabel")}>
            <Input
              placeholder={t("workoutForm.titlePlaceholder")}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </Field>

          {mode === "plan" ? (
            <>
              {/* Scheduling: a single day, or a flexible window */}
              <label className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                <span className="text-sm font-medium">
                  {t("workoutForm.flexible")}
                </span>
                <Switch
                  checked={form.flexible}
                  onCheckedChange={(v) => set("flexible", v)}
                />
              </label>
              {form.flexible ? (
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("workoutForm.windowStart")}>
                    <Input
                      type="date"
                      value={form.windowStart}
                      onChange={(e) => set("windowStart", e.target.value)}
                    />
                  </Field>
                  <Field label={t("workoutForm.windowEnd")}>
                    <Input
                      type="date"
                      value={form.windowEnd}
                      onChange={(e) => set("windowEnd", e.target.value)}
                    />
                  </Field>
                </div>
              ) : (
                <Field label={t("workoutForm.date")}>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => set("date", e.target.value)}
                  />
                </Field>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label={t("workoutForm.distanceKm")}>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={form.plannedDistanceKm}
                    onChange={(e) => set("plannedDistanceKm", e.target.value)}
                  />
                </Field>
                <Field label={t("workoutForm.paceLabel")}>
                  <Input
                    placeholder="4:58"
                    value={form.plannedPace}
                    onChange={(e) => set("plannedPace", e.target.value)}
                  />
                </Field>
              </div>
            </>
          ) : (
            <>
              <Field label={t("workoutForm.date")}>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              </Field>
              <Field label={t("workoutForm.distanceKm")}>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={form.actualDistanceKm}
                  onChange={(e) => set("actualDistanceKm", e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("workoutForm.durationMin")}>
                  <Input
                    inputMode="text"
                    placeholder="mm:ss"
                    readOnly={durationComputed}
                    aria-readonly={durationComputed}
                    className={durationComputed ? "bg-muted text-muted-foreground" : undefined}
                    value={durationFieldValue}
                    onChange={(e) => set("durationMin", e.target.value)}
                  />
                </Field>
                <Field label={t("workoutForm.paceLabel")}>
                  <Input
                    placeholder="4:58"
                    readOnly={paceComputed}
                    aria-readonly={paceComputed}
                    className={paceComputed ? "bg-muted text-muted-foreground" : undefined}
                    value={paceFieldValue}
                    onChange={(e) => set("actualPace", e.target.value)}
                  />
                </Field>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("workoutForm.computeHint")}
              </p>
              <Field label={t("workoutForm.startTime")}>
                <TimeField
                  value={form.startTime}
                  onChange={(v) => set("startTime", v)}
                />
              </Field>
              <Field label={t("workoutForm.notes")}>
                <textarea
                  className="min-h-16 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  placeholder={t("workoutForm.notesPlaceholder")}
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </Field>
              <label className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                <span className="text-sm font-medium">
                  {t("workoutForm.completed")}
                </span>
                <Switch
                  checked={form.completed}
                  onCheckedChange={(v) => set("completed", v)}
                />
              </label>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {isEdit ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="size-4" /> {t("common.delete")}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave}>{t("common.save")}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
