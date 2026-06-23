import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { OnboardingGate } from "@/components/common/onboarding-gate";
import { SyncInitializer } from "@/components/common/sync-initializer";
import { Toaster } from "@/components/common/toaster";
import { AppNav } from "@/components/layout/app-nav";
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
};

export const viewport: Viewport = {
  themeColor: "#fc4c02",
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
          <SyncInitializer />
          <OnboardingGate />
          <Toaster />
          <div className="flex min-h-dvh">
            <AppNav />
            <div className="flex min-w-0 flex-1 flex-col">
              {/* Mobile top bar */}
              <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur md:hidden">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                    🏃
                  </span>
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
