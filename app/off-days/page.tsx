import { HydrationGate } from "@/components/common/hydration-gate";
import { PageHeader } from "@/components/common/page-header";
import { OffDaysView } from "@/components/off-days/off-days-view";

export default function OffDaysPage() {
  return (
    <>
      <PageHeader title="Off days" subtitle="Periods that may limit training." />
      <HydrationGate>
        <OffDaysView />
      </HydrationGate>
    </>
  );
}
