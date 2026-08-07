"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

/** The range title, plus Today/prev/next when the view is pageable. */
export function CalendarHeader({
  title,
  paged,
  onToday,
  onPrev,
  onNext,
}: {
  title: string;
  paged: boolean;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {paged ? (
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={onToday}>
            {t("calendar.today")}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("calendar.prev")}
            onClick={onPrev}
          >
            <ChevronLeft className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("calendar.next")}
            onClick={onNext}
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
