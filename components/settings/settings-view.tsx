"use client";

import { format } from "date-fns";
import { Check, Copy, Download, RefreshCw, Sparkles, Trash2, Upload } from "lucide-react";
import { useTheme } from "next-themes";
import { useRef, useState } from "react";
import { CloudSyncCard } from "@/components/settings/cloud-sync-card";
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
import { downloadJSON } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { useTrainingStore } from "@/store/use-training-store";

const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const AI_PROMPT = `Here is my marathon training plan as JSON.

Change I want: [describe your change here — e.g. "I'm at a festival from 2026-08-14 to 2026-08-16 and can't train; move, shorten or remove those workouts and adjust the surrounding days so the build still makes sense"].

You MAY freely reschedule, add, remove or modify any PLANNED (not-yet-completed) future workout to make this work.

You MUST follow these rules:
- NEVER change the race date. Keep "raceDate" exactly the same and keep the marathon / race-day workout on its date — the marathon date is fixed.
- NEVER alter a completed workout: any workout with "completed": true must stay exactly as-is, including its "id", "completed", "actualDistanceKm", "actualPace" and "durationMin" (don't lose my logged progress).
- Keep the JSON structure valid (plans, weeks, workouts). If you move a workout to a different week, also move its id into that week's "workoutIds", and keep each workout's "date" inside its week's start/end range.
- Return the complete updated JSON only, nothing else.

JSON (paste below, or attach the exported .json file):
[paste your exported JSON here]`;

export function SettingsView() {
  const plans = useTrainingStore((s) => s.plans);
  const activePlanId = useTrainingStore((s) => s.activePlanId);
  const activePlan = useActivePlan();
  const selectPlan = useTrainingStore((s) => s.selectPlan);
  const deletePlan = useTrainingStore((s) => s.deletePlan);
  const updatePlanMeta = useTrainingStore((s) => s.updatePlanMeta);
  const regenerateActivePlan = useTrainingStore((s) => s.regenerateActivePlan);
  const exportData = useTrainingStore((s) => s.exportData);
  const importData = useTrainingStore((s) => s.importData);

  const { theme, setTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importText, setImportText] = useState("");
  const [copied, setCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(
    null,
  );

  const planList = Object.values(plans);

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
      setStatus({ ok: true, msg: "Plans imported successfully." });
      setImportText("");
    } catch (e) {
      setStatus({
        ok: false,
        msg: e instanceof Error ? e.message : "Import failed.",
      });
    }
  };

  const handleFile = async (file: File) => runImport(await file.text());

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(AI_PROMPT);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 1500);
  };

  return (
    <div className="space-y-5">
      {/* Plans */}
      <Card className="gap-0 p-4">
        <h3 className="mb-3 text-sm font-semibold">Plans</h3>
        <Label className="text-xs text-muted-foreground">Active plan</Label>
        <Select
          value={activePlanId ?? undefined}
          onValueChange={(v) => selectPlan(v as string)}
        >
          <SelectTrigger className="mt-1.5 w-full">
            <SelectValue>
              {(value) =>
                (value && plans[value as string]?.name) || "Select a plan"
              }
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
              <Trash2 className="size-4" /> Delete this plan
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Delete plan?</DialogTitle>
                <DialogDescription>
                  This permanently removes “{activePlan?.name}” and its logged
                  progress. This cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:justify-end">
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <DialogClose
                  render={
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (activePlanId) deletePlan(activePlanId);
                        setStatus({ ok: true, msg: "Plan deleted." });
                      }}
                    />
                  }
                >
                  Delete
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
      </Card>

      {/* Race details (active plan) */}
      {activePlan ? (
        <Card className="gap-0 p-4">
          <h3 className="mb-3 text-sm font-semibold">Race details</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Plan name">
              <Input
                value={activePlan.name}
                onChange={(e) => updatePlanMeta({ name: e.target.value })}
              />
            </Field>
            <Field label="Race name">
              <Input
                value={activePlan.raceName}
                onChange={(e) => updatePlanMeta({ raceName: e.target.value })}
              />
            </Field>
            <Field label="Race date">
              <Input
                type="date"
                value={activePlan.raceDate}
                onChange={(e) => updatePlanMeta({ raceDate: e.target.value })}
              />
            </Field>
            <Field label="Goal label">
              <Input
                value={activePlan.goalLabel}
                onChange={(e) => updatePlanMeta({ goalLabel: e.target.value })}
              />
            </Field>
            <Field label="Goal pace (mm:ss /km)">
              <Input
                value={activePlan.goalPace}
                onChange={(e) => updatePlanMeta({ goalPace: e.target.value })}
              />
            </Field>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Changing the race date takes effect when you regenerate this plan.
          </p>
        </Card>
      ) : null}

      {/* Appearance */}
      <Card className="gap-0 p-4">
        <h3 className="mb-3 text-sm font-semibold">Appearance</h3>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTheme(t.value)}
              className={cn(
                "rounded-lg border py-2 text-sm font-medium transition-colors",
                theme === t.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-accent",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Cloud sync */}
      <CloudSyncCard />

      {/* Data */}
      <Card className="gap-0 p-4">
        <h3 className="mb-1 text-sm font-semibold">Data</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Everything is stored locally in your browser. Export all your plans to
          back up or to hand the schema to an agent.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="size-4" /> Export JSON
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy JSON"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-4" /> Import file
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
          <Label className="text-xs text-muted-foreground">…or paste JSON</Label>
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
            Import pasted JSON
          </Button>
        </div>

        {/* Edit with AI helper */}
        <div className="mt-4 rounded-lg border bg-muted/40 p-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <p className="text-xs font-semibold">Edit your plan with AI</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Export your JSON, paste it to an AI chatbot with the prompt below,
            then import the result. The AI can freely reshuffle upcoming
            workouts, but the prompt keeps your race date fixed and your
            completed workouts untouched.
          </p>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-md border bg-background p-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {AI_PROMPT}
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
            {promptCopied ? "Copied" : "Copy prompt"}
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
        <h3 className="mb-1 text-sm font-semibold">Regenerate plan</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Rebuild “{activePlan?.name}” from scratch for its race date. This
          erases all logged progress and custom workouts in this plan.
        </p>
        <Dialog>
          <DialogTrigger render={<Button variant="outline" size="sm" />}>
            <RefreshCw className="size-4" /> Regenerate
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Regenerate this plan?</DialogTitle>
              <DialogDescription>
                This replaces “{activePlan?.name}” and removes all completed and
                custom workouts in it. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:justify-end">
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <DialogClose
                render={
                  <Button
                    variant="destructive"
                    onClick={() => {
                      regenerateActivePlan();
                      setStatus({ ok: true, msg: "Plan regenerated." });
                    }}
                  />
                }
              >
                Yes, regenerate
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
