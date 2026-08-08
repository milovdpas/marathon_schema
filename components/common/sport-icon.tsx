"use client";

import { Bike, Footprints, Waves } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Sport } from "@/lib/sport";
import { cn } from "@/lib/utils";

/**
 * Sport is the icon; intensity is the colour (see `WorkoutTypeBadge`).
 *
 * Keeping the two axes on separate visual channels is what stops the badge
 * growing: three sports x five intensities is fifteen labels, but one icon
 * beside one coloured pill says the same thing.
 */
export const SPORT_ICON: Record<Sport, LucideIcon> = {
  run: Footprints,
  bike: Bike,
  swim: Waves,
};

export function SportIcon({
  sport,
  className,
}: {
  sport: Sport;
  className?: string;
}) {
  const { t } = useTranslation();
  const Icon = SPORT_ICON[sport];
  // Labelled rather than aria-hidden: on a mixed plan this icon is the only
  // thing distinguishing a 40 km ride from a 40 km run.
  return (
    <Icon
      role="img"
      aria-label={t(`sport.${sport}`)}
      className={cn("size-3.5 shrink-0 text-muted-foreground", className)}
    />
  );
}
