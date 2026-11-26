import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { MobileSplashScreen } from "@/components/layout/mobile-splash-screen";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { AnalyticsScripts } from "@/features/analytics/components/analytics-scripts";
import { PageViewTracker } from "@/features/analytics/components/page-view-tracker";
import { JsonLd } from "@/components/seo/json-ld";
import { APP } from "@/lib/constants";
import { APP_URL } from "@/lib/app-url";
import { getRequestCountryLocale } from "@/lib/countries/server";
import { isRtlLocale } from "@/lib/countries/types";
import { buildSiteStructuredData } from "@/lib/seo/structured-data";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});



export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP.name} — Buy & Sell Mobile Phones`,
    template: `%s · ${APP.name}`,
  },
  description: APP.description,
  applicationName: APP.name,
  openGraph: {
    type: "website",
    siteName: APP.name,
    title: APP.name,
    description: APP.description,
    url: APP_URL,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#181818" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale } = await getRequestCountryLocale();
  const messages = await getMessages({ locale });

  return (
    <html
      lang={locale}
      dir={isRtlLocale(locale) ? "rtl" : "ltr"}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <JsonLd data={buildSiteStructuredData(APP_URL)} />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="bg-background text-foreground focus:not-sr-only sr-only fixed top-3 start-3 z-100 rounded-lg border px-4 py-2 text-sm font-semibold"
        >
          Skip to content
        </a>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <MobileSplashScreen />
          <Providers>
            {children}
            <Toaster richColors position="top-center" />
          </Providers>
        </NextIntlClientProvider>
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        <AnalyticsScripts />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
