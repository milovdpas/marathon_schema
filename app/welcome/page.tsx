import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata: Metadata = {
  title: "Get started",
  description:
    "Set up RacePilot in under a minute. Free, no account, and your training data stays on your device.",
  // A setup flow has nothing to rank for, and indexing it would compete with
  // the landing page for the same terms.
  robots: { index: false, follow: true },
};

export default function WelcomePage() {
  return <OnboardingFlow />;
}
