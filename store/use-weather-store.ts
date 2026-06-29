import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { fetchWeatherStatus } from "@/lib/weather";
import { pruneExpired } from "@/lib/weather-cache";

interface Coords {
  lat: number;
  lon: number;
}

interface WeatherState {
  /** True once the server reports a weather API key is configured. */
  configured: boolean;
  /** True once the initial status check has completed. */
  ready: boolean;
  /** Last known device location (so we don't re-prompt every fetch). */
  lastCoords: Coords | null;

  init: () => Promise<void>;
  setCoords: (c: Coords) => void;
}

export const useWeatherStore = create<WeatherState>()(
  persist(
    (set) => ({
      configured: false,
      ready: false,
      lastCoords: null,

      init: async () => {
        pruneExpired();
        const { configured } = await fetchWeatherStatus();
        set({ configured, ready: true });
      },

      setCoords: (c) => set({ lastCoords: c }),
    }),
    {
      name: "marathon-weather-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lastCoords: s.lastCoords }),
    },
  ),
);
