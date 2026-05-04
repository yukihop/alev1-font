import type { MetadataRoute } from "next";

import { loadUsageCounts } from "@/lib/alev";
import { scanArticles } from "@/lib/articles";
import { canonicalPath, siteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { entries } = await scanArticles();
  const characterPaths = Object.keys(loadUsageCounts())
    .sort((left, right) => left.localeCompare(right))
    .map((binary) => `/character/${binary}`);

  return [...entries.map((entry) => entry.path), ...characterPaths].map(
    (path) => ({
      url: new URL(canonicalPath(path), siteUrl).toString(),
    }),
  );
}
