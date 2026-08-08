import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NextPlanGate } from "@/components/common/next-plan-gate";
import { OnboardingGate } from "@/components/common/onboarding-gate";
import { SyncInitializer } from "@/components/common/sync-initializer";
import { Toaster } from "@/components/common/toaster";
import { AppLogo } from "@/components/layout/app-logo";
import { AppNav } from "@/components/layout/app-nav";
import { ServiceWorker } from "@/components/layout/service-worker";
import { I18nProvider } from "@/components/layout/i18n-provider";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Marathon Tracker",
  description: "Track your marathon training progress.",
  applicationName: "Marathon",
  // Installed to a home screen, this should open chromeless like the manifest
  // asks for; iOS reads it from here rather than the manifest.
  appleWebApp: { capable: true, title: "Marathon", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  // The literal value of --brand in globals.css. Keep the two in step: this is
  // the browser/OS chrome colour and a mismatch shows as a seam above the app.
  themeColor: "#f1472c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
          <ServiceWorker />
          <SyncInitializer />
          <OnboardingGate />
          <NextPlanGate />
          <Toaster />
          <div className="flex min-h-dvh">
            <AppNav />
            <div className="flex min-w-0 flex-1 flex-col">
              {/* Mobile top bar */}
              <header className="sticky top-0 z-(--z-topbar) flex h-(--h-topbar) items-center justify-between border-b bg-background/80 px-4 backdrop-blur md:hidden">
                <div className="flex items-center gap-2">
                  <AppLogo size="sm" />
                  <span className="text-sm font-semibold">Marathon</span>
                </div>
                <ThemeToggle />
              </header>
              <main className="flex-1 px-4 pb-24 pt-5 md:px-8 md:pb-12 md:pt-8">
                <div className="mx-auto w-full max-w-3xl">{children}</div>
              </main>
            </div>
          </div>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
