"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TrainingPrefsFields } from "@/components/common/training-prefs-fields";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRange, toISO } from "@/lib/date";
import { paceFromDistanceDuration, parseDurationToMinutes } from "@/lib/pace";
import { downloadJSON } from "@/lib/storage";
import type { OffDay, TrainingPrefs } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "@/store/use-toast-store";
import { useTrainingStore } from "@/store/use-training-store";

interface LatestRun {
  distanceKm: string;
  time: string; // total time, e.g. "50:43" or "1:05:30"
  date: string;
}

interface Draft {
  name: string;
  raceName: string;
  raceDistanceKm: number;
  raceDate: string;
  startDate: string;
  goalType: "finish" | "time" | "pace";
  goalValue: string;
  offDays: OffDay[];
  latestRuns: LatestRun[];
  prefs: TrainingPrefs;
}

const DISTANCE_PRESETS = [
  { km: 42.2, label: "Marathon" },
  { km: 21.1, label: "½ Marathon" },
  { km: 10, label: "10K" },
  { km: 5, label: "5K" },
];

const WEEKDAY_KEYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `off-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}

export function AddPlanWizard() {
  const { t } = useTranslation();
  const router = useRouter();
  const addPlanFromImport = useTrainingStore((s) => s.addPlanFromImport);

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(() => ({
    name: "",
    raceName: "Marathon",
    raceDistanceKm: 42.2,
    raceDate: "",
    startDate: toISO(new Date()),
    goalType: "finish",
    goalValue: "",
    offDays: [],
    latestRuns: [],
    prefs: {
      daysPerWeek: 4,
      flexibleDays: false,
      trainingDays: [true, false, true, true, false, false, true],
      planningMode: "exact",
      targetDistanceKm: null,
    },
  }));
  const [importText, setImportText] = useState("");
  const [requestCopied, setRequestCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [off, setOff] = useState({ title: "", start: "", end: "", note: "" });

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const STEPS = [
    t("wizard.stepRace"),
    t("wizard.stepOffDays"),
    t("wizard.stepTraining"),
    t("wizard.stepAi"),
  ];

  const buildRequest = () => ({
    app: "marathon-tracker-plan-request",
    version: 1,
    race: {
      name: draft.name.trim(),
      raceName: draft.raceName.trim(),
      distanceKm: draft.raceDistanceKm,
      date: draft.raceDate,
    },
    startDate: draft.startDate,
    goal: {
      type: draft.goalType,
      value: draft.goalType === "finish" ? null : draft.goalValue.trim() || null,
    },
    offDays: draft.offDays,
    latestRuns: draft.latestRuns
      .filter((r) => r.distanceKm)
      .map((r) => {
        const distanceKm = Number(r.distanceKm) || 0;
        const durationMin = parseDurationToMinutes(r.time) ?? null;
        return {
          distanceKm,
          durationMin, // total time in minutes
          pace: paceFromDistanceDuration(distanceKm, durationMin ?? undefined) ?? null,
          date: r.date,
        };
      }),
    training: {
      daysPerWeek: draft.prefs.daysPerWeek,
      flexibleDays: draft.prefs.flexibleDays,
      trainingDays: draft.prefs.flexibleDays
        ? null
        : WEEKDAY_KEYS.filter((_, i) => draft.prefs.trainingDays[i]),
      planningMode: draft.prefs.planningMode,
      targetDistanceKm: draft.prefs.targetDistanceKm,
    },
  });

  const requestJson = () => JSON.stringify(buildRequest(), null, 2);
  const handleExportRequest = () =>
    downloadJSON("marathon-plan-request.json", requestJson());
  const handleCopyRequest = async () => {
    await navigator.clipboard.writeText(requestJson());
    setRequestCopied(true);
    setTimeout(() => setRequestCopied(false), 1500);
  };
  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(t("wizard.aiPrompt"));
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 1500);
  };

  const complete = (json: string) => {
    try {
      addPlanFromImport(json, draft.prefs, draft.startDate);
      toast.success(t("wizard.created"));
      router.push("/");
    } catch (e) {
      console.error("Plan import failed:", e);
      setError(t("wizard.completeError"));
    }
  };

  const canAddOff =
    !!off.title.trim() && !!off.start && !!off.end && off.start <= off.end;

  const addOffDay = () => {
    if (!canAddOff) return;
    set("offDays", [
      ...draft.offDays,
      {
        id: newId(),
        title: off.title.trim(),
        start: off.start,
        end: off.end,
        note: off.note.trim() || undefined,
      },
    ]);
    setOff({ title: "", start: "", end: "", note: "" });
  };

  const step1Valid = draft.name.trim() && draft.raceDate && draft.startDate;

  return (
    <div className="space-y-5">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-1">
            <div
              className={cn(
                "h-1.5 rounded-full",
                i + 1 <= step ? "bg-primary" : "bg-muted",
              )}
            />
            <span
              className={cn(
                "truncate text-[11px]",
                i + 1 === step
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1 — Race */}
      {step === 1 ? (
        <Card className="gap-0 space-y-3 p-4">
          <Field label={t("wizard.planName")}>
            <Input
              placeholder={t("wizard.planNamePlaceholder")}
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <Field label={t("wizard.raceName")}>
            <Input
              placeholder={t("wizard.raceNamePlaceholder")}
              value={draft.raceName}
              onChange={(e) => set("raceName", e.target.value)}
            />
          </Field>
          <div>
            <Label className="text-xs text-muted-foreground">
              {t("wizard.raceDistance")}
            </Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {DISTANCE_PRESETS.map((p) => (
                <button
                  key={p.km}
                  type="button"
                  onClick={() => set("raceDistanceKm", p.km)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    draft.raceDistanceKm === p.km
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:bg-accent",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              className="mt-2"
              aria-label={t("wizard.distanceCustom")}
              value={draft.raceDistanceKm}
              onChange={(e) => set("raceDistanceKm", Number(e.target.value) || 0)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("wizard.startDate")}>
              <Input
                type="date"
                value={draft.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </Field>
            <Field label={t("wizard.raceDate")}>
              <Input
                type="date"
                value={draft.raceDate}
                onChange={(e) => set("raceDate", e.target.value)}
              />
            </Field>
          </div>
          <p className="-mt-1 text-xs text-muted-foreground">
            {t("wizard.startDateHint")}
          </p>

          <div>
            <Label className="text-xs text-muted-foreground">
              {t("wizard.goalQ")}
            </Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {(["finish", "time", "pace"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => set("goalType", g)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    draft.goalType === g
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:bg-accent",
                  )}
                >
                  {t(`wizard.goal${g === "finish" ? "Finish" : g === "time" ? "Time" : "Pace"}`)}
                </button>
              ))}
            </div>
            {draft.goalType !== "finish" ? (
              <Input
                className="mt-2"
                placeholder={
                  draft.goalType === "time"
                    ? t("wizard.goalTimePlaceholder")
                    : t("wizard.goalPacePlaceholder")
                }
                value={draft.goalValue}
                onChange={(e) => set("goalValue", e.target.value)}
              />
            ) : null}
          </div>
        </Card>
      ) : null}

      {/* Step 2 — Off days */}
      {step === 2 ? (
        <Card className="gap-0 space-y-3 p-4">
          <p className="text-xs text-muted-foreground">{t("wizard.offDaysIntro")}</p>
          {draft.offDays.length > 0 ? (
            <div className="space-y-2">
              {draft.offDays.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{o.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRange(o.start, o.end)}
                      {o.note ? ` · ${o.note}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="remove"
                    onClick={() =>
                      set("offDays", draft.offDays.filter((x) => x.id !== o.id))
                    }
                    className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <div className="grid gap-2 rounded-lg border p-3">
            <Input
              placeholder={t("offDays.titlePlaceholder")}
              value={off.title}
              onChange={(e) => setOff((o) => ({ ...o, title: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={off.start}
                onChange={(e) => setOff((o) => ({ ...o, start: e.target.value }))}
              />
              <Input
                type="date"
                value={off.end}
                onChange={(e) => setOff((o) => ({ ...o, end: e.target.value }))}
              />
            </div>
            <Input
              placeholder={t("offDays.notePlaceholder")}
              value={off.note}
              onChange={(e) => setOff((o) => ({ ...o, note: e.target.value }))}
            />
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              disabled={!canAddOff}
              onClick={addOffDay}
            >
              <Plus className="size-4" /> {t("common.add")}
            </Button>
          </div>
          <Button variant="ghost" size="sm" disabled className="self-start">
            {t("wizard.calendarSoon")}
          </Button>
        </Card>
      ) : null}

      {/* Step 3 — Training */}
      {step === 3 ? (
        <Card className="gap-0 space-y-4 p-4">
          <div>
            <Label className="text-xs text-muted-foreground">
              {t("wizard.latestRuns")}
            </Label>
            <p className="mb-2 mt-0.5 text-xs text-muted-foreground">
              {t("wizard.latestRunsHint")}
            </p>
            <div className="space-y-2">
              {draft.latestRuns.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder={t("wizard.runDistance")}
                    value={r.distanceKm}
                    onChange={(e) =>
                      set(
                        "latestRuns",
                        draft.latestRuns.map((x, j) =>
                          j === i ? { ...x, distanceKm: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <Input
                    placeholder={t("wizard.runTimePlaceholder")}
                    value={r.time}
                    onChange={(e) =>
                      set(
                        "latestRuns",
                        draft.latestRuns.map((x, j) =>
                          j === i ? { ...x, time: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <Input
                    type="date"
                    value={r.date}
                    onChange={(e) =>
                      set(
                        "latestRuns",
                        draft.latestRuns.map((x, j) =>
                          j === i ? { ...x, date: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    aria-label="remove run"
                    onClick={() =>
                      set("latestRuns", draft.latestRuns.filter((_, j) => j !== i))
                    }
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() =>
                set("latestRuns", [
                  ...draft.latestRuns,
                  { distanceKm: "", time: "", date: "" },
                ])
              }
            >
              <Plus className="size-4" /> {t("wizard.addRun")}
            </Button>
          </div>

          <TrainingPrefsFields
            prefs={draft.prefs}
            onChange={(patch) =>
              setDraft((d) => ({ ...d, prefs: { ...d.prefs, ...patch } }))
            }
          />
        </Card>
      ) : null}

      {/* Step 4 — AI */}
      {step === 4 ? (
        <Card className="gap-0 space-y-3 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <p className="text-sm font-semibold">{t("wizard.stepAi")}</p>
          </div>
          <p className="text-xs text-muted-foreground">{t("wizard.aiIntro")}</p>
          <ol className="space-y-1 text-xs text-muted-foreground">
            <li>{t("wizard.aiStep1")}</li>
            <li>{t("wizard.aiStep2")}</li>
            <li>{t("wizard.aiStep3")}</li>
            <li>{t("wizard.aiStep4")}</li>
          </ol>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleExportRequest}>
              <Download className="size-4" /> {t("wizard.exportRequest")}
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyRequest}>
              {requestCopied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {requestCopied ? t("wizard.copied") : t("wizard.copyRequest")}
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyPrompt}>
              {promptCopied ? (
                <Check className="size-4" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {promptCopied ? t("wizard.copied") : t("wizard.copyPrompt")}
            </Button>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">
              {t("wizard.importLabel")}
            </Label>
            <textarea
              className="mt-1.5 h-28 w-full resize-y rounded-md border bg-transparent px-3 py-2 font-mono text-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder='{"plans": …}'
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                setError(null);
              }}
            />
            <div className="mt-2 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="size-4" /> {t("wizard.attachFile")}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) complete(await f.text());
                  e.target.value = "";
                }}
              />
              <Button
                size="sm"
                disabled={!importText.trim()}
                onClick={() => complete(importText)}
              >
                {t("wizard.completePlan")}
              </Button>
            </div>
            {error ? (
              <p className="mt-2 text-xs text-destructive">{error}</p>
            ) : null}
          </div>
        </Card>
      ) : null}

      {/* Nav */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => (step === 1 ? router.push("/") : setStep(step - 1))}
        >
          <ArrowLeft className="size-4" /> {t("wizard.back")}
        </Button>
        {step < 4 ? (
          <Button
            disabled={step === 1 && !step1Valid}
            onClick={() => setStep(step + 1)}
          >
            {t("wizard.next")} <ArrowRight className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
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
