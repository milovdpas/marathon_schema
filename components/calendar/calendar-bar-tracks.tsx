"use client";

import { TYPE_STYLE } from "@/components/common/workout-type-badge";
import { type PlacedBar, trackCount } from "@/lib/calendar-layout";
import { cn } from "@/lib/utils";

/** The spanning bars for one week: off-day periods and flexible windows. */
export function CalendarBarTracks({
  bars,
  onSelectDate,
}: {
  bars: readonly PlacedBar[];
  onSelectDate: (iso: string) => void;
}) {
  const tracks = trackCount(bars);
  if (tracks === 0) return null;

  return (
    <>
      {Array.from({ length: tracks }).map((_, track) => (
        <div key={track} className="mt-0.5 grid grid-cols-7 gap-1">
          {bars
            .filter((b) => b.track === track)
            .map((bar) => (
              <CalendarBar
                key={bar.ev.key}
                bar={bar}
                onSelectDate={onSelectDate}
              />
            ))}
        </div>
      ))}
    </>
  );
}

function CalendarBar({
  bar,
  onSelectDate,
}: {
  bar: PlacedBar;
  onSelectDate: (iso: string) => void;
}) {
  const isFlex = bar.ev.kind === "flex";

  return (
    <button
      type="button"
      title={bar.ev.label}
      onClick={() =>
        onSelectDate(isFlex ? (bar.ev.chosenDate ?? bar.startIso) : bar.startIso)
      }
      style={{ gridColumn: `${bar.startCol + 1} / span ${bar.span}` }}
      className={cn(
        "relative flex h-5 items-center overflow-hidden rounded-md px-1.5 pb-1 text-left text-[10px] font-medium",
        isFlex ? TYPE_STYLE[bar.ev.type!].badge : "bg-tempo/15 text-tempo",
        bar.continuesLeft && "rounded-l-none",
        bar.continuesRight && "rounded-r-none",
      )}
    >
      <span className="truncate">{bar.ev.label}</span>
      {/* Underline marks the day the flexible workout is currently planned
          on — kept clear of the label. */}
      {isFlex && bar.chosenOffset != null ? (
        <span
          className={cn(
            "pointer-events-none absolute bottom-[2px] h-[3px] rounded-full",
            TYPE_STYLE[bar.ev.type!].dot,
          )}
          style={{
            left: `calc(${(bar.chosenOffset / bar.span) * 100}% + 4px)`,
            width: `calc(${(1 / bar.span) * 100}% - 8px)`,
          }}
        />
      ) : null}
    </button>
  );
}
