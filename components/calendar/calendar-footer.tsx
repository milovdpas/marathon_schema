"use client";

import { useTranslation } from "react-i18next";
import { CalendarLegend } from "@/components/calendar/calendar-legend";
import type { CalendarViewMode } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The legend strip below the calendar.
 *
 * In the grid views it just follows the calendar. The agenda is thousands of
 * pixels long, so scrolling to the bottom for it isn't realistic — there it
 * pins above the mobile nav. It sticks to bottom-0 and pads its own content
 * clear of the nav, so the background runs behind the nav rather than leaving
 * a see-through strip.
 */
export function CalendarFooter({ view }: { view: CalendarViewMode }) {
  const { t } = useTranslation();
  const isGrid = view === "month" || view === "week";

  return (
    <div
      className={cn(
        "space-y-2",
        view === "agenda" &&
          "sticky bottom-0 z-(--z-sticky) -mx-4 border-t bg-background px-4 pb-(--h-bottomnav) pt-2 md:-mx-8 md:px-8 md:pb-2",
      )}
    >
      <CalendarLegend />
      {/* Spanning bars only exist in the grid views. */}
      {isGrid ? (
        <p className="text-xs text-muted-foreground">
          {t("calendar.flexLegend")}
        </p>
      ) : null}
    </div>
  );
}
