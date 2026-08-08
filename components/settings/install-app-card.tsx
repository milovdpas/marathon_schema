"use client";

import { Download, Share } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useInstallApp } from "@/hooks/use-install-app";

/**
 * Install-to-home-screen. Chromium hands us a real prompt; iOS has no such API
 * and never has, so there it explains the Share-sheet route rather than
 * showing a button that cannot work.
 *
 * Renders nothing once installed, or in a browser that can't install and isn't
 * iOS — a card whose only message is "already done" is just noise.
 */
export function InstallAppCard() {
  const { t } = useTranslation();
  const { mode, install } = useInstallApp();

  if (mode === "installed" || mode === "unavailable") return null;

  return (
    <Card className="gap-0 p-4">
      <h3 className="mb-1 text-sm font-semibold">{t("install.title")}</h3>
      <p className="mb-3 text-xs text-muted-foreground">{t("install.body")}</p>

      {mode === "prompt" ? (
        <Button size="sm" className="self-start" onClick={() => void install()}>
          <Download className="size-4" /> {t("install.action")}
        </Button>
      ) : (
        // iOS: Safari offers no install API, so these are the manual steps.
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <Share className="size-3.5 shrink-0 text-primary" />
            {t("install.iosStep1")}
          </li>
          <li>{t("install.iosStep2")}</li>
          <li>{t("install.iosStep3")}</li>
        </ol>
      )}
    </Card>
  );
}
