import { HydrationGate } from "@/components/common/hydration-gate";
import { PageHeader } from "@/components/common/page-header";
import { AddPlanWizard } from "@/components/wizard/add-plan-wizard";

export default function NewPlanPage() {
  return (
    <>
      <PageHeader titleKey="wizard.title" />
      <HydrationGate>
        <AddPlanWizard />
      </HydrationGate>
    </>
  );
}
