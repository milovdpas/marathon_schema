import type { Metadata } from "next";
import { HydrationGate } from "@/components/common/hydration-gate";
import { PageHeader } from "@/components/common/page-header";
import { AddPlanWizard } from "@/components/wizard/add-plan-wizard";

export const metadata: Metadata = { title: "New plan" };

/**
 * `?from=<planId>` arrives when starting the next plan from a finished one.
 * Read on the server so the wizard doesn't need `useSearchParams` (which would
 * force a Suspense boundary and opt the route out of static rendering).
 */
export default async function NewPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const { from } = await searchParams;
  const fromPlanId = typeof from === "string" ? from : undefined;

  return (
    <>
      <PageHeader titleKey="wizard.title" />
      <HydrationGate>
        <AddPlanWizard fromPlanId={fromPlanId} />
      </HydrationGate>
    </>
  );
}
