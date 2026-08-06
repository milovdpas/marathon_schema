"use client";

import { useTranslation } from "react-i18next";

const ROWS: [string, string, string, number][] = [
  ["1", "4:50", "1", 100],
  ["2", "5:09", "-0", 78],
  ["3", "5:24", "-0", 62],
  ["4", "5:42", "-1", 45],
  ["0.3", "5:34", "-1", 55],
];

/**
 * A mock of Strava's "Splits" section, so the help dialog can show exactly what
 * to capture without shipping (or asking the user for) a real screenshot.
 * Deliberately styled like Strava's dark UI, since that's what they'll see.
 */
export function SplitsExample() {
  const { t } = useTranslation();
  return (
    <figure className="overflow-hidden rounded-lg border">
      <div className="bg-neutral-900 p-3 text-neutral-100">
        <p className="mb-2 text-sm font-bold">Splits</p>
        <div className="flex items-center gap-2 border-b border-neutral-700 pb-1 text-[10px] text-neutral-400">
          <span className="w-6">Km</span>
          <span className="w-9">Pace</span>
          <span className="flex-1" />
          <span className="w-6 text-right">Elev</span>
        </div>
        {ROWS.map(([km, pace, elev, bar]) => (
          <div key={km} className="flex items-center gap-2 py-[3px] text-[11px]">
            <span className="w-6 tabular-nums">{km}</span>
            <span className="w-9 tabular-nums">{pace}</span>
            <span className="flex-1">
              <span
                className="block h-2 rounded-[2px] bg-[#2f7fd1]"
                style={{ width: `${bar}%` }}
              />
            </span>
            <span className="w-6 text-right tabular-nums">{elev}</span>
          </div>
        ))}
      </div>
      <figcaption className="border-t bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
        {t("splitScanner.exampleCaption")}
      </figcaption>
    </figure>
  );
}
