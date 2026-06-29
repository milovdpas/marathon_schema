"use client";

import { useEffect } from "react";
import { useSyncStore } from "@/store/use-sync-store";
import { useWeatherStore } from "@/store/use-weather-store";

/** Kicks off cloud-sync + weather init once on mount. */
export function SyncInitializer() {
  useEffect(() => {
    void useSyncStore.getState().init();
    void useWeatherStore.getState().init();
  }, []);
  return null;
}
