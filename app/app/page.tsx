import type { Metadata } from "next";
import { HydrationGate } from "@/components/common/hydration-gate";
import { PageHeader } from "@/components/common/page-header";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader titleKey="dashboard.title" subtitleKey="dashboard.subtitle" />
      <HydrationGate>
        <DashboardView />
      </HydrationGate>
    </>
  );
}
