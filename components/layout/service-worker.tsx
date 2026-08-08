"use client";

import { useEffect } from "react";

/**
 * Registers public/sw.js. Without a registered worker that has a fetch
 * handler, Chrome on Android downgrades "Install app" to a home-screen
 * bookmark rather than a real WebAPK.
 *
 * Skipped in development: an active worker intercepting navigations fights
 * with hot reload, and dev is served over http anyway.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((e) => {
        console.error("Service worker registration failed:", e);
      });
    };

    // Wait for load so registration never competes with the first paint.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
