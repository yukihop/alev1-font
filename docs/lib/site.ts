import type { Metadata } from "next";

export const siteUrl = new URL("https://alev1-font.pages.dev");
export const siteName = "ALEV-1文字ドキュメント＆フォント";
export const siteDescription = "ALEV文字解析とフォント配布プロジェクト";

export function canonicalPath(path: string): string {
  if (path === "/") {
    return path;
  }

  return path.endsWith("/") ? path : `${path}/`;
}

export function createPageMetadata(
  title: string,
  path: string,
  description: string,
): Metadata {
  const canonical = canonicalPath(path);
  const pageTitle =
    canonical === "/"
      ? `${siteName} - ${siteDescription}`
      : `${title} | ${siteName}`;

  return {
    title: {
      absolute: pageTitle,
    },
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName,
      title: pageTitle,
      description,
      locale: "ja_JP",
      images: ["/assets/opengraph-image.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: ["/assets/opengraph-image.png"],
    },
  };
}
