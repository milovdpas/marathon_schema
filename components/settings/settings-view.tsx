"use client";

import { format } from "date-fns";
import { Check, Copy, Download, Plus, RefreshCw, Sparkles, Trash2, Upload } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TrainingPrefsFields } from "@/components/common/training-prefs-fields";
import { CloudSyncCard } from "@/components/settings/cloud-sync-card";
import { WeatherCard } from "@/components/settings/weather-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useActivePlan } from "@/hooks/use-active-plan";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n";
import { DEFAULT_TRAINING_PREFS } from "@/lib/plan-generator";
import { downloadJSON } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { toast } from "@/store/use-toast-store";
import { useTrainingStore } from "@/store/use-training-store";

const THEMES = [
  { value: "light", key: "settings.themeLight" },
  { value: "dark", key: "settings.themeDark" },
  { value: "system", key: "settings.themeSystem" },
];

export function SettingsView() {
  const { t } = useTranslation();
  const plans = useTrainingStore((s) => s.plans);
  const activePlanId = useTrainingStore((s) => s.activePlanId);
  const activePlan = useActivePlan();
  const selectPlan = useTrainingStore((s) => s.selectPlan);
  const deletePlan = useTrainingStore((s) => s.deletePlan);
  const updatePlanMeta = useTrainingStore((s) => s.updatePlanMeta);
  const updateTrainingPrefs = useTrainingStore((s) => s.updateTrainingPrefs);
  const regenerateActivePlan = useTrainingStore((s) => s.regenerateActivePlan);
  const exportData = useTrainingStore((s) => s.exportData);
  const importData = useTrainingStore((s) => s.importData);
  const locale = useTrainingStore((s) => s.preferences.locale);
  const setPreferences = useTrainingStore((s) => s.setPreferences);

  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importText, setImportText] = useState("");
  const [copied, setCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(
    null,
  );

  const planList = Object.values(plans);
  const aiPrompt = t("settings.aiPrompt");

  const handleExport = () => {
    const json = exportData();
    if (!json) return;
    downloadJSON(`marathon-plans-${format(new Date(), "yyyy-MM-dd")}.json`, json);
  };

  const handleCopy = async () => {
    const json = exportData();
    if (!json) return;
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const runImport = (json: string) => {
    try {
      importData(json);
      setStatus({ ok: true, msg: t("settings.importedOk") });
      toast.success(t("settings.importedOk"));
      setImportText("");
    } catch (e) {
      console.error("Import failed:", e);
      setStatus({ ok: false, msg: t("settings.importFailed") });
    }
  };

  const handleFile = async (file: File) => runImport(await file.text());

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(aiPrompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 1500);
  };

  return (
    <div className="space-y-5">
      {/* Plans */}
      <Card className="gap-0 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t("settings.plans")}</h3>
          <Button size="sm" onClick={() => router.push("/plan/new")}>
            <Plus className="size-4" /> {t("settings.addPlan")}
          </Button>
        </div>
        <Label className="text-xs text-muted-foreground">
          {t("settings.activePlan")}
        </Label>
        <Select
          value={activePlanId ?? undefined}
          onValueChange={(v) => selectPlan(v as string)}
        >
          <SelectTrigger className="mt-1.5 w-full">
            <SelectValue>
              {(value) => (value && plans[value as string]?.name) || ""}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {planList.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {planList.length > 1 ? (
          <Dialog>
            <DialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 self-start text-destructive hover:text-destructive"
                />
              }
            >
              <Trash2 className="size-4" /> {t("settings.deleteThisPlan")}
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>{t("settings.deletePlanTitle")}</DialogTitle>
                <DialogDescription>
                  {t("settings.deletePlanDesc", { name: activePlan?.name })}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:justify-end">
                <DialogClose render={<Button variant="outline" />}>
                  {t("common.cancel")}
                </DialogClose>
                <DialogClose
                  render={
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (activePlanId) deletePlan(activePlanId);
                        setStatus({ ok: true, msg: t("settings.planDeleted") });
                      }}
                    />
                  }
                >
                  {t("common.delete")}
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
      </Card>

      {/* Race details (active plan) */}
      {activePlan ? (
        <Card className="gap-0 p-4">
          <h3 className="mb-3 text-sm font-semibold">
            {t("settings.raceDetails")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("settings.planName")}>
              <Input
                value={activePlan.name}
                onChange={(e) => updatePlanMeta({ name: e.target.value })}
              />
            </Field>
            <Field label={t("settings.raceName")}>
              <Input
                value={activePlan.raceName}
                onChange={(e) => updatePlanMeta({ raceName: e.target.value })}
              />
            </Field>
            <Field label={t("settings.raceDistance")}>
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={activePlan.raceDistanceKm}
                onChange={(e) =>
                  updatePlanMeta({
                    raceDistanceKm: Number(e.target.value) || 0,
                  })
                }
              />
            </Field>
            <Field label={t("settings.startDate")}>
              <Input
                type="date"
                value={activePlan.startDate ?? ""}
                onChange={(e) => updatePlanMeta({ startDate: e.target.value })}
              />
            </Field>
            <Field label={t("settings.raceDate")}>
              <Input
                type="date"
                value={activePlan.raceDate}
                onChange={(e) => updatePlanMeta({ raceDate: e.target.value })}
              />
            </Field>
            <Field label={t("settings.goalLabel")}>
              <Input
                value={activePlan.goalLabel}
                onChange={(e) => updatePlanMeta({ goalLabel: e.target.value })}
              />
            </Field>
            <Field label={t("settings.goalPace")}>
              <Input
                value={activePlan.goalPace}
                onChange={(e) => updatePlanMeta({ goalPace: e.target.value })}
              />
            </Field>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("settings.raceDateNote")}
          </p>
        </Card>
      ) : null}

      {/* Training preferences (active plan) */}
      {activePlan ? (
        <Card className="gap-0 p-4">
          <h3 className="mb-3 text-sm font-semibold">
            {t("settings.trainingPrefs")}
          </h3>
          <TrainingPrefsFields
            prefs={activePlan.trainingPrefs ?? DEFAULT_TRAINING_PREFS}
            onChange={(patch) => updateTrainingPrefs(patch)}
          />
        </Card>
      ) : null}

      {/* Appearance */}
      <Card className="gap-0 p-4">
        <h3 className="mb-3 text-sm font-semibold">{t("settings.appearance")}</h3>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={cn(
                "rounded-lg border py-2 text-sm font-medium transition-colors",
                theme === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-accent",
              )}
            >
              {t(opt.key)}
            </button>
          ))}
        </div>

        <Label className="mt-4 mb-1.5 block text-xs text-muted-foreground">
          {t("settings.language")}
        </Label>
        <Select
          value={locale ?? "en"}
          onValueChange={(v) => setPreferences({ locale: v as Locale })}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              {(value) => LOCALE_LABELS[(value as Locale) ?? "en"]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {LOCALES.map((l) => (
              <SelectItem key={l} value={l}>
                {LOCALE_LABELS[l]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {/* Cloud sync */}
      <CloudSyncCard />

      {/* Weather */}
      <WeatherCard />

      {/* Data */}
      <Card className="gap-0 p-4">
        <h3 className="mb-1 text-sm font-semibold">{t("settings.data")}</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          {t("settings.dataIntro")}
        </p>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="size-4" /> {t("settings.exportJson")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? t("settings.copied") : t("settings.copyJson")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-4" /> {t("settings.importFile")}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </div>

        <div className="mt-3">
          <Label className="text-xs text-muted-foreground">
            {t("settings.pasteJson")}
          </Label>
          <textarea
            className="mt-1.5 h-24 w-full resize-y rounded-md border bg-transparent px-3 py-2 font-mono text-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            placeholder='{"plans": …}'
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <Button
            size="sm"
            className="mt-2"
            disabled={!importText.trim()}
            onClick={() => runImport(importText)}
          >
            {t("settings.importPasted")}
          </Button>
        </div>

        {/* Edit with AI helper */}
        <div className="mt-4 rounded-lg border bg-muted/40 p-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <p className="text-xs font-semibold">{t("settings.aiTitle")}</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("settings.aiIntro")}
          </p>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-md border bg-background p-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {aiPrompt}
          </pre>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={handleCopyPrompt}
          >
            {promptCopied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            {promptCopied ? t("settings.copied") : t("settings.copyPrompt")}
          </Button>
        </div>

        {status ? (
          <p
            className={cn(
              "mt-3 text-xs",
              status.ok ? "text-easy" : "text-destructive",
            )}
          >
            {status.msg}
          </p>
        ) : null}
      </Card>

      {/* Danger zone */}
      <Card className="gap-0 border-destructive/30 p-4">
        <h3 className="mb-1 text-sm font-semibold">
          {t("settings.regenerateTitle")}
        </h3>
        <p className="mb-3 text-xs text-muted-foreground">
          {t("settings.regenerateDesc", { name: activePlan?.name })}
        </p>
        <Dialog>
          <DialogTrigger render={<Button variant="outline" size="sm" />}>
            <RefreshCw className="size-4" /> {t("settings.regenerate")}
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t("settings.regenerateConfirmTitle")}</DialogTitle>
              <DialogDescription>
                {t("settings.regenerateConfirmDesc", { name: activePlan?.name })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:justify-end">
              <DialogClose render={<Button variant="outline" />}>
                {t("common.cancel")}
              </DialogClose>
              <DialogClose
                render={
                  <Button
                    variant="destructive"
                    onClick={() => {
                      regenerateActivePlan();
                      setStatus({ ok: true, msg: t("settings.planRegenerated") });
                    }}
                  />
                }
              >
                {t("settings.regenerateYes")}
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
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
