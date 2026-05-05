import "./globals.css";

import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";

import { loadLexicon, loadUsageCounts } from "@/lib/alev";
import { AlevDataProvider } from "@/lib/alev-data-context";
import { siteDescription, siteName, siteUrl } from "@/lib/site";

const themeBootScript = `(function () {
  try {
    var stored = localStorage.getItem('alev-docs-theme');
    var theme = stored === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
  } catch {}
})();`;

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  alternateName: ["ALEV文字", "ALEV文字ドキュメント", "ALEV-1 Language & Font"],
  url: siteUrl.toString(),
  inLanguage: "ja",
};

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: siteName,
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName,
    title: siteName,
    description: siteDescription,
    locale: "ja_JP",
    images: ["/assets/opengraph-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: ["/assets/opengraph-image.png"],
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

const RootLayout = (props: RootLayoutProps) => {
  const { children } = props;
  const lexicon = Array.from(loadLexicon().values());
  const usageCounts = loadUsageCounts();

  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        <Script id="theme-boot" strategy="beforeInteractive">
          {themeBootScript}
        </Script>
        <Script id="website-jsonld" type="application/ld+json">
          {JSON.stringify(websiteJsonLd)}
        </Script>
        <AlevDataProvider lexicon={lexicon} usageCounts={usageCounts}>
          {children}
        </AlevDataProvider>
      </body>
    </html>
  );
};

export default RootLayout;
