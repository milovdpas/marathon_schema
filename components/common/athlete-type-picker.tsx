"use client";

import { useTranslation } from "react-i18next";
import { ATHLETE_TYPES, type AthleteType } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The mark for each kind of athlete. Emoji rather than icon components because
 * these are identity, not affordances — and because a triathlete's mark is
 * genuinely three sports, which no single glyph says.
 */
export const ATHLETE_EMOJI: Record<AthleteType, string> = {
  runner: "🏃",
  trail: "🏔️",
  ultra: "♾️",
  triathlete: "🏊🚴🏃",
  cyclist: "🚴",
  swimmer: "🏊",
};

/**
 * Multi-select: plenty of people run trails *and* race triathlon. Selection
 * order is preserved, because the first pick becomes the athlete's `primary`
 * and drives the app's mark.
 */
export function AthleteTypePicker({
  value,
  onChange,
}: {
  value: AthleteType[];
  onChange: (next: AthleteType[]) => void;
}) {
  const { t } = useTranslation();

  const toggle = (type: AthleteType) =>
    onChange(
      value.includes(type)
        ? value.filter((v) => v !== type)
        : [...value, type],
    );

  return (
    // Squares, two per row. A horizontal card had to truncate both lines to fit
    // beside the mark, and a triathlete's is three glyphs wide, so on a phone
    // the labels were unreadable. Stacked, the text gets the full card width.
    <div className="grid grid-cols-2 gap-2">
      {ATHLETE_TYPES.map((type) => {
        const selected = value.includes(type);
        return (
          <button
            key={type}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(type)}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-colors",
              selected ? "border-primary bg-primary/10" : "hover:bg-accent",
            )}
          >
            <span aria-hidden className="text-2xl leading-none">
              {ATHLETE_EMOJI[type]}
            </span>
            <span className="text-sm font-medium leading-tight">
              {t(`athlete.${type}`)}
            </span>
            <span className="text-xs leading-tight text-muted-foreground">
              {t(`athlete.${type}Desc`)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
