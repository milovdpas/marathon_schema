import { HydrationGate } from "@/components/common/hydration-gate";
import { PageHeader } from "@/components/common/page-header";
import { StatsView } from "@/components/stats/stats-view";

export default function StatsPage() {
  return (
    <>
      <PageHeader title="Statistics" subtitle="Your training, by the numbers." />
      <HydrationGate>
        <StatsView />
      </HydrationGate>
    </>
  );
}
