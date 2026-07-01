"use client";

import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Current local time as "HH:mm". */
function nowHHmm(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** A time-of-day input with a "Now" shortcut button. Empty by default. */
export function TimeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <Input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange(nowHHmm())}
      >
        <Clock className="size-4" /> {t("common.now")}
      </Button>
    </div>
  );
}
