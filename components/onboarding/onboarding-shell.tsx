"use client";

import { AppLogo } from "@/components/layout/app-logo";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Chrome for the welcome flow. Full-bleed on purpose: this route sits outside
 * `app/app/layout.tsx`, so there is no nav or top bar to compete with, and a
 * first-time visitor has nowhere to click that isn't a decision.
 */
export function OnboardingShell({
  step,
  total,
  title,
  subtitle,
  children,
  footer,
}: {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    // Fixed to the viewport, with only the step body scrolling. Letting the
    // whole page scroll meant a taller step (the six athlete cards) pushed
    // Continue below the fold, so the flow's own controls had to be hunted for.
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <div className="mx-auto flex h-full w-full max-w-md flex-col px-5">
        <header className="flex shrink-0 items-center gap-2 pt-6">
          <AppLogo size="sm" />
          <span className="text-sm font-semibold">{SITE_NAME}</span>
        </header>

        <div
          className="mt-6 flex shrink-0 gap-1.5"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={total}
        >
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>

        <div className="shrink-0 pt-6">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>

        {/* `min-h-0` is what actually lets this shrink inside the flex column;
            without it the child's height wins and the container overflows. */}
        <main className="min-h-0 flex-1 overflow-y-auto py-6">{children}</main>

        <div className="flex shrink-0 flex-col gap-2 pb-6">{footer}</div>
      </div>
    </div>
  );
}
