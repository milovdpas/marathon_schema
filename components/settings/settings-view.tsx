"use client";

import { format } from "date-fns";
import { Check, Copy, Download, RefreshCw, Upload } from "lucide-react";
import { useTheme } from "next-themes";
import { useRef, useState } from "react";
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
import { downloadJSON } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { useTrainingStore } from "@/store/use-training-store";

const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function SettingsView() {
  const preferences = useTrainingStore((s) => s.preferences);
  const setPreferences = useTrainingStore((s) => s.setPreferences);
  const exportData = useTrainingStore((s) => s.exportData);
  const importData = useTrainingStore((s) => s.importData);
  const regeneratePlan = useTrainingStore((s) => s.regeneratePlan);

  const { theme, setTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importText, setImportText] = useState("");
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(
    null,
  );

  const handleExport = () => {
    const json = exportData();
    if (!json) return;
    downloadJSON(
      `marathon-plan-${format(new Date(), "yyyy-MM-dd")}.json`,
      json,
    );
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
      setStatus({ ok: true, msg: "Plan imported successfully." });
      setImportText("");
    } catch (e) {
      setStatus({
        ok: false,
        msg: e instanceof Error ? e.message : "Import failed.",
      });
    }
  };

  const handleFile = async (file: File) => {
    runImport(await file.text());
  };

  return (
    <div className="space-y-5">
      {/* Race details */}
      <Card className="gap-0 p-4">
        <h3 className="mb-3 text-sm font-semibold">Race details</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Race name">
            <Input
              value={preferences.raceName}
              onChange={(e) => setPreferences({ raceName: e.target.value })}
            />
          </Field>
          <Field label="Race date">
            <Input
              type="date"
              value={preferences.raceDate}
              onChange={(e) => setPreferences({ raceDate: e.target.value })}
            />
          </Field>
          <Field label="Goal label">
            <Input
              value={preferences.goalLabel}
              onChange={(e) => setPreferences({ goalLabel: e.target.value })}
            />
          </Field>
          <Field label="Goal pace (mm:ss /km)">
            <Input
              value={preferences.goalPace}
              onChange={(e) => setPreferences({ goalPace: e.target.value })}
            />
          </Field>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Changing the race date takes effect when you regenerate the plan.
        </p>
      </Card>

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

      {/* Data */}
      <Card className="gap-0 p-4">
        <h3 className="mb-1 text-sm font-semibold">Data</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Everything is stored locally in your browser. Export to back up or to
          hand the schema to an agent.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="size-4" /> Export JSON
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
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
          <Label className="text-xs text-muted-foreground">
            …or paste JSON
          </Label>
          <textarea
            className="mt-1.5 h-24 w-full resize-y rounded-md border bg-transparent px-3 py-2 font-mono text-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            placeholder='{"plan": …}'
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
          Rebuild the default 16-week plan from scratch. This erases all logged
          progress and custom workouts.
        </p>
        <Dialog>
          <DialogTrigger render={<Button variant="outline" size="sm" />}>
            <RefreshCw className="size-4" /> Regenerate
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Regenerate plan?</DialogTitle>
              <DialogDescription>
                This replaces your current plan and removes all completed and
                custom workouts. This cannot be undone.
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
                      regeneratePlan();
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
