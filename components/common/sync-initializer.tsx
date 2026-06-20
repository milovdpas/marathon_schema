"use client";

import { useEffect } from "react";
import { useSyncStore } from "@/store/use-sync-store";

/** Kicks off cloud-sync init (silent reconnect + auto-push wiring) once. */
export function SyncInitializer() {
  useEffect(() => {
    void useSyncStore.getState().init();
  }, []);
  return null;
}
