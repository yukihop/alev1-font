import "./globals.css";

import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";

import { siteDescription, siteName, siteUrl } from "@/lib/site";

const themeBootScript = `(function () {
  var stored = localStorage.getItem('alev-docs-theme');
  var theme = stored === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
})();`;

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  alternateName: "ALEV-1",
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
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

const RootLayout = (props: RootLayoutProps) => {
  const { children } = props;

  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        <Script id="theme-boot" strategy="beforeInteractive">
          {themeBootScript}
        </Script>
        <Script id="website-jsonld" type="application/ld+json">
          {JSON.stringify(websiteJsonLd)}
        </Script>
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
