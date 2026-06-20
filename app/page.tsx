import { HydrationGate } from "@/components/common/hydration-gate";
import { PageHeader } from "@/components/common/page-header";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Your road to the start line." />
      <HydrationGate>
        <DashboardView />
      </HydrationGate>
    </>
  );
}
