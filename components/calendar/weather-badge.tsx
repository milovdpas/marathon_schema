"use client";

import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
} from "lucide-react";
import type { WeatherSnapshot } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Render a coloured lucide icon for an OpenWeatherMap condition id. */
export function WeatherIcon({
  id,
  className,
}: {
  id: number;
  className?: string;
}) {
  const c = (color: string) => cn(className, color);
  if (id >= 200 && id < 300)
    return <CloudLightning className={c("text-amber-500")} />;
  if (id >= 300 && id < 400)
    return <CloudDrizzle className={c("text-sky-500")} />;
  if (id >= 500 && id < 600) return <CloudRain className={c("text-blue-500")} />;
  if (id >= 600 && id < 700) return <CloudSnow className={c("text-sky-300")} />;
  if (id >= 700 && id < 800) return <CloudFog className={c("text-slate-400")} />;
  if (id === 800) return <Sun className={c("text-amber-500")} />;
  if (id === 801) return <CloudSun className={c("text-amber-400")} />;
  return <Cloud className={c("text-slate-400")} />;
}

export function WeatherBadge({
  snapshot,
  className,
}: {
  snapshot: WeatherSnapshot;
  className?: string;
}) {
  return (
    <span
      title={snapshot.condition}
      className={cn(
        "inline-flex items-center gap-0.5 text-[9px] leading-none text-muted-foreground",
        className,
      )}
    >
      <WeatherIcon id={snapshot.conditionId} className="size-3 shrink-0" />
      {snapshot.tempC == null ? "" : `${Math.round(snapshot.tempC)}°`}
    </span>
  );
}
