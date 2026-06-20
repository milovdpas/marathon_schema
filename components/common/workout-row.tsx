"use client";

import { Check, Pencil } from "lucide-react";
import { formatDayLabel } from "@/lib/date";
import { formatPace } from "@/lib/pace";
import type { Workout } from "@/lib/types";
import { cn } from "@/lib/utils";
import { WorkoutTypeBadge } from "@/components/common/workout-type-badge";

export function WorkoutRow({
  workout,
  onToggle,
  onEdit,
  showDate = true,
  className,
}: {
  workout: Workout;
  onToggle?: (id: string) => void;
  onEdit?: (workout: Workout) => void;
  showDate?: boolean;
  className?: string;
}) {
  const { completed } = workout;
  const hasActual =
    workout.actualDistanceKm != null || workout.actualPace != null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 transition-colors",
        completed && "border-primary/30 bg-primary/[0.04]",
        className,
      )}
    >
      {onToggle ? (
        <button
          type="button"
          aria-label={completed ? "Mark incomplete" : "Mark complete"}
          onClick={() => onToggle(workout.id)}
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-full border transition-colors",
            completed
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40 text-transparent hover:border-primary",
          )}
        >
          <Check className="size-4" strokeWidth={3} />
        </button>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <WorkoutTypeBadge type={workout.type} />
          {workout.isCustom ? (
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              custom
            </span>
          ) : null}
        </div>
        <p
          className={cn(
            "mt-1 truncate text-sm font-medium",
            completed && "text-muted-foreground line-through",
          )}
        >
          {workout.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {showDate ? <>{formatDayLabel(workout.date)} · </> : null}
          {hasActual && completed
            ? `${workout.actualDistanceKm ?? workout.plannedDistanceKm} km · ${formatPace(
                workout.actualPace ?? workout.plannedPace,
              )}`
            : `${workout.plannedDistanceKm} km · ${formatPace(workout.plannedPace)}`}
        </p>
      </div>

      {onEdit ? (
        <button
          type="button"
          aria-label="Edit workout"
          onClick={() => onEdit(workout)}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Pencil className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
