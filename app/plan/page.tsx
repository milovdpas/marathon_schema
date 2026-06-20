import { HydrationGate } from "@/components/common/hydration-gate";
import { PageHeader } from "@/components/common/page-header";
import { PlanView } from "@/components/plan/plan-view";

export default function PlanPage() {
  return (
    <>
      <PageHeader
        title="Marathon Plan"
        subtitle="Your training block, grouped by week."
      />
      <HydrationGate>
        <PlanView />
      </HydrationGate>
    </>
  );
}
