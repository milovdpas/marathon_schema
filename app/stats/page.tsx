import { HydrationGate } from "@/components/common/hydration-gate";
import { PageHeader } from "@/components/common/page-header";
import { StatsView } from "@/components/stats/stats-view";

export default function StatsPage() {
  return (
    <>
      <PageHeader titleKey="stats.title" subtitleKey="stats.subtitle" />
      <HydrationGate>
        <StatsView />
      </HydrationGate>
    </>
  );
}
