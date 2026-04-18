import type { Metadata } from "next";

export const siteUrl = new URL("https://alev1-font.pages.dev");
export const siteName = "ALEV文字ドキュメント";
export const siteDescription = "ALEV文字解析とフォント配布プロジェクト";

export function canonicalPath(path: string): string {
  if (path === "/") {
    return path;
  }

  return path.endsWith("/") ? path : `${path}/`;
}

export function createPageMetadata(title: string, path: string): Metadata {
  const canonical = canonicalPath(path);

  return {
    title,
    alternates: {
      canonical,
    },
    openGraph: {
      url: canonical,
      title,
    },
  };
}
