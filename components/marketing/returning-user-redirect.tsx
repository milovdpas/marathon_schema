"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { APP_PATH } from "@/lib/site";
import { useTrainingStore } from "@/store/use-training-store";

/** Launched from a home screen rather than a browser tab. */
function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Sends someone who already uses the app straight into it.
 *
 * The landing page is for people who don't have an account yet — which here
 * means people with no plans in localStorage. A crawler never hydrates, so it
 * keeps the marketing HTML; an installed app never shows the pitch.
 *
 * This is a separate client component so the page module itself stays free of
 * the store, which would otherwise pull the whole of Zustand and the plan
 * types into the bundle of the one page that has to be fast.
 */
export function ReturningUserRedirect() {
  const router = useRouter();
  const hydrated = useTrainingStore((s) => s.hydrated);
  const hasPlans = useTrainingStore((s) => Object.keys(s.plans).length > 0);
  const [standalone] = useState(detectStandalone);

  const shouldRedirect = standalone || (hydrated && hasPlans);

  useEffect(() => {
    if (shouldRedirect) router.replace(APP_PATH);
  }, [shouldRedirect, router]);

  return null;
}
