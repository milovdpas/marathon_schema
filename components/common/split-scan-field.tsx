"use client";

import { Loader2, ScanText, X } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SplitsList } from "@/components/common/splits-list";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { scanSplits } from "@/lib/split-scanner";
import type { WorkoutSplit } from "@/lib/types";
import { toast } from "@/store/use-toast-store";
import { useTrainingStore } from "@/store/use-training-store";

/**
 * "Scan screenshot" control for the log dialogs. Only renders when the split
 * scanner is enabled in settings. OCR runs on-device; the image is discarded.
 */
export function SplitScanField({
  splits,
  onChange,
}: {
  splits: WorkoutSplit[];
  onChange: (splits: WorkoutSplit[]) => void;
}) {
  const { t } = useTranslation();
  const enabled = useTrainingStore((s) => s.preferences.splitScannerEnabled);
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);

  if (!enabled) return null;

  const handleFile = async (file: File) => {
    setScanning(true);
    try {
      const { splits: found } = await scanSplits(file);
      if (found.length === 0) {
        toast.error(t("splitScanner.scanFailed"));
        return;
      }
      onChange(found);
      toast.success(t("splitScanner.scanned", { count: found.length }));
    } catch (e) {
      console.error("Split scan failed:", e);
      toast.error(t("splitScanner.scanFailed"));
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">
        {t("splitScanner.splitsTitle")}
      </Label>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={scanning}
          onClick={() => fileRef.current?.click()}
        >
          {scanning ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ScanText className="size-4" />
          )}
          {scanning ? t("splitScanner.scanning") : t("splitScanner.scanButton")}
        </Button>
        {splits.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => onChange([])}
          >
            <X className="size-4" /> {t("splitScanner.clear")}
          </Button>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {splits.length > 0 ? <SplitsList splits={splits} className="mt-1" /> : null}
    </div>
  );
}
