import "./globals.css";

import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";

const themeBootScript = `(function () {
  var stored = localStorage.getItem('alev-docs-theme');
  var theme = stored === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
})();`;

export const metadata: Metadata = {
  title: {
    default: "ALEV-1 ドキュメント",
    template: "%s | ALEV-1 ドキュメント",
  },
  description: "ALEV文字解析とフォント配布プロジェクト",
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
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
