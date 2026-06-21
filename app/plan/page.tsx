import { HydrationGate } from "@/components/common/hydration-gate";
import { PageHeader } from "@/components/common/page-header";
import { PlanView } from "@/components/plan/plan-view";

export default function PlanPage() {
  return (
    <>
      <PageHeader titleKey="plan.title" subtitleKey="plan.subtitle" />
      <HydrationGate>
        <PlanView />
      </HydrationGate>
    </>
  );
}
