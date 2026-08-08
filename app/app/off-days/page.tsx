import type { Metadata } from "next";
import { HydrationGate } from "@/components/common/hydration-gate";
import { PageHeader } from "@/components/common/page-header";
import { OffDaysView } from "@/components/off-days/off-days-view";

export const metadata: Metadata = { title: "Off days" };

export default function OffDaysPage() {
  return (
    <>
      <PageHeader titleKey="offDays.title" subtitleKey="offDays.subtitle" />
      <HydrationGate>
        <OffDaysView />
      </HydrationGate>
    </>
  );
}
