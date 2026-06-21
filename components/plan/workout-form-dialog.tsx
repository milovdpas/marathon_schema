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
import { paceFromDistanceDuration } from "@/lib/pace";
import { WORKOUT_TYPES, type Workout, type WorkoutType } from "@/lib/types";
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
  notes: string;
  completed: boolean;
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
    notes: "",
    completed: false,
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
    durationMin: w.durationMin != null ? String(w.durationMin) : "",
    actualPace: w.actualPace ?? "",
    notes: w.notes ?? "",
    completed: w.completed,
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

  // Reset the form to the target workout whenever the dialog opens (adjusting
  // state during render — the recommended alternative to a reset-in-effect).
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setForm(workout ? fromWorkout(workout) : blankForm(defaultDate ?? ""));
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const derivedPace = paceFromDistanceDuration(
    num(form.actualDistanceKm),
    num(form.durationMin),
  );

  const handleSave = () => {
    const plannedDistanceKm = num(form.plannedDistanceKm) ?? 0;
    const actualDistanceKm = num(form.actualDistanceKm);
    const durationMin = num(form.durationMin);
    const actualPace =
      form.actualPace.trim() ||
      paceFromDistanceDuration(actualDistanceKm, durationMin) ||
      undefined;

    const common = {
      date: form.date,
      type: form.type,
      title: form.title.trim() || t(`workoutType.${form.type}`),
      plannedDistanceKm,
      plannedPace: form.plannedPace.trim() || undefined,
      actualDistanceKm,
      durationMin,
      actualPace,
      notes: form.notes.trim() || undefined,
      completed: form.completed,
    };

    if (isEdit && workout) {
      updateWorkout(workout.id, common);
    } else {
      addWorkout(common);
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
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("workoutForm.date")}>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </Field>
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
          </div>

          <Field label={t("workoutForm.titleLabel")}>
            <Input
              placeholder={t("workoutForm.titlePlaceholder")}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </Field>

          <fieldset className="rounded-lg border p-3">
            <legend className="px-1 text-xs font-medium text-muted-foreground">
              {t("workoutForm.planned")}
            </legend>
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
          </fieldset>

          <fieldset className="rounded-lg border p-3">
            <legend className="px-1 text-xs font-medium text-muted-foreground">
              {t("workoutForm.actual")}
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("workoutForm.distanceKm")}>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={form.actualDistanceKm}
                  onChange={(e) => set("actualDistanceKm", e.target.value)}
                />
              </Field>
              <Field label={t("workoutForm.durationMin")}>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="1"
                  value={form.durationMin}
                  onChange={(e) => set("durationMin", e.target.value)}
                />
              </Field>
            </div>
            <div className="mt-3">
              <Field label={t("workoutForm.paceLabel")}>
                <Input
                  placeholder={derivedPace ?? t("workoutForm.paceAuto")}
                  value={form.actualPace}
                  onChange={(e) => set("actualPace", e.target.value)}
                />
              </Field>
              {derivedPace && !form.actualPace ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("workoutForm.willCompute", { pace: derivedPace })}
                </p>
              ) : null}
            </div>
          </fieldset>

          <Field label={t("workoutForm.notes")}>
            <textarea
              className="min-h-16 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder={t("workoutForm.notesPlaceholder")}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>

          <label className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <span className="text-sm font-medium">{t("workoutForm.completed")}</span>
            <Switch
              checked={form.completed}
              onCheckedChange={(v) => set("completed", v)}
            />
          </label>
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
