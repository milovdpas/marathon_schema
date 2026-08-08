"use client";

import { useEffect, useState } from "react";

/** The Chromium-only event that lets a page trigger its own install prompt. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallMode =
  /** Already running from the home screen. */
  | "installed"
  /** Chromium fired beforeinstallprompt — we can open the real dialog. */
  | "prompt"
  /** iOS/Safari has no install API; the user must use the Share sheet. */
  | "ios-manual"
  /** Nothing we can offer (desktop Firefox, an in-app browser, …). */
  | "unavailable";

/** Launched from the home screen rather than a browser tab. */
function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari's own flag, which predates display-mode and is still the only
    // signal on iOS.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac, so the touch-point check catches it too.
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
  );
}

/**
 * Whether — and how — this browser can install the app.
 *
 * Only Chromium exposes an API for this. Safari on iOS has no equivalent and
 * has repeatedly declined to add one, so the honest best is to detect iOS and
 * show the Share → Add to Home Screen steps instead of a dead button.
 *
 * The two device facts are read in `useState` initializers rather than an
 * effect: they can't change within a session, and this only ever mounts
 * client-side behind `<HydrationGate>`.
 */
export function useInstallApp(): {
  mode: InstallMode;
  install: () => Promise<"accepted" | "dismissed" | "unavailable">;
} {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(detectStandalone);
  const [isIOS] = useState(detectIOS);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      // Chrome shows its own mini-infobar otherwise; we want our own button.
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const mode: InstallMode = installed
    ? "installed"
    : deferred
      ? "prompt"
      : isIOS
        ? "ios-manual"
        : "unavailable";

  const install = async () => {
    if (!deferred) return "unavailable" as const;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    // The event is single-use — Chrome fires a fresh one if it still applies.
    setDeferred(null);
    return outcome;
  };

  return { mode, install };
}
