import { CalendarView } from "@/components/calendar/calendar-view";
import { HydrationGate } from "@/components/common/hydration-gate";
import { PageHeader } from "@/components/common/page-header";

export default function CalendarPage() {
  return (
    <>
      <PageHeader titleKey="calendar.title" subtitleKey="calendar.subtitle" />
      <HydrationGate>
        <CalendarView />
      </HydrationGate>
    </>
  );
}
