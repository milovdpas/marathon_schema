"use client";

import { useTranslation } from "react-i18next";
import { type WorkoutType } from "@/lib/types";
import { cn } from "@/lib/utils";

// Static class strings (so Tailwind's scanner can see them).
export const TYPE_STYLE: Record<
  WorkoutType,
  { badge: string; dot: string; text: string; stroke: string }
> = {
  easy: {
    badge: "bg-easy/15 text-easy",
    dot: "bg-easy",
    text: "text-easy",
    stroke: "var(--easy)",
  },
  tempo: {
    badge: "bg-tempo/15 text-tempo",
    dot: "bg-tempo",
    text: "text-tempo",
    stroke: "var(--tempo)",
  },
  interval: {
    badge: "bg-interval/15 text-interval",
    dot: "bg-interval",
    text: "text-interval",
    stroke: "var(--interval)",
  },
  long: {
    badge: "bg-long/15 text-long",
    dot: "bg-long",
    text: "text-long",
    stroke: "var(--long)",
  },
  recovery: {
    badge: "bg-recovery/15 text-recovery",
    dot: "bg-recovery",
    text: "text-recovery",
    stroke: "var(--recovery)",
  },
};

export function WorkoutTypeBadge({
  type,
  className,
}: {
  type: WorkoutType;
  className?: string;
}) {
  const style = TYPE_STYLE[type];
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        style.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", style.dot)} />
      {t(`workoutType.${type}`)}
    </span>
  );
}

export function WorkoutTypeDot({
  type,
  className,
}: {
  type: WorkoutType;
  className?: string;
}) {
  return (
    <span
      className={cn("size-2 rounded-full", TYPE_STYLE[type].dot, className)}
    />
  );
}
