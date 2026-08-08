"use client";

import { useEffect } from "react";
import { APP_COOKIE, APP_COOKIE_MAX_AGE } from "@/lib/app-cookie";
import { useTrainingStore } from "@/store/use-training-store";

/**
 * Mirrors "this browser has training data" into a cookie so `middleware.ts` can
 * skip the landing page for returning users without a flash.
 *
 * Kept in sync in both directions: clearing your plans clears the cookie too,
 * or someone who wiped their data would be bounced into an empty app instead of
 * seeing the landing page they should.
 *
 * `SameSite=Lax` because the only thing it does is choose which of our own
 * pages to show; it is deliberately not `HttpOnly`, since it has to be written
 * from here.
 */
export function AppCookieSync() {
  const hydrated = useTrainingStore((s) => s.hydrated);
  const hasPlans = useTrainingStore((s) => Object.keys(s.plans).length > 0);

  useEffect(() => {
    if (!hydrated) return;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = hasPlans
      ? `${APP_COOKIE}=1; Path=/; Max-Age=${APP_COOKIE_MAX_AGE}; SameSite=Lax${secure}`
      : `${APP_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  }, [hydrated, hasPlans]);

  return null;
}
