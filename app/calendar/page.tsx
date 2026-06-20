import { CalendarView } from "@/components/calendar/calendar-view";
import { HydrationGate } from "@/components/common/hydration-gate";
import { PageHeader } from "@/components/common/page-header";

export default function CalendarPage() {
  return (
    <>
      <PageHeader title="Calendar" subtitle="Your training month at a glance." />
      <HydrationGate>
        <CalendarView />
      </HydrationGate>
    </>
  );
}
