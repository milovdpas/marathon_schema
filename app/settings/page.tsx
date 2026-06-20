import { HydrationGate } from "@/components/common/hydration-gate";
import { PageHeader } from "@/components/common/page-header";
import { SettingsView } from "@/components/settings/settings-view";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Preferences, theme, and your data." />
      <HydrationGate>
        <SettingsView />
      </HydrationGate>
    </>
  );
}
