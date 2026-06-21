import { HydrationGate } from "@/components/common/hydration-gate";
import { PageHeader } from "@/components/common/page-header";
import { SettingsView } from "@/components/settings/settings-view";

export default function SettingsPage() {
  return (
    <>
      <PageHeader titleKey="settings.title" subtitleKey="settings.subtitle" />
      <HydrationGate>
        <SettingsView />
      </HydrationGate>
    </>
  );
}
