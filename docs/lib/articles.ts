import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { cache } from 'react';

import matter from 'gray-matter';
import YAML from 'yaml';

import contentRoot from './contentRoot';

export type ArticleFrontMatter = {
  title: string;
};

export type ArticleEntry = {
  slug: string;
  path: string;
  title: string;
  order: number;
};

type MetaFile = {
  title?: string;
  order?: string[];
};

async function readMetaFile(): Promise<MetaFile> {
  const source = await readFile(path.join(contentRoot, 'meta.yaml'), 'utf8');
  const parsed = YAML.parse(source) as MetaFile | null;
  return parsed ?? {};
}

async function readFrontMatter(slug: string): Promise<ArticleFrontMatter> {
  const source = await readFile(path.join(contentRoot, `${slug}.mdx`), 'utf8');
  const parsed = matter(source);
  return parsed.data as ArticleFrontMatter;
}

async function scanArticlesImpl(): Promise<{ siteTitle: string; entries: ArticleEntry[] }> {
  const [meta, dirents] = await Promise.all([
    readMetaFile(),
    readdir(contentRoot, { withFileTypes: true }),
  ]);
  const order = Array.isArray(meta.order) ? meta.order : [];
  const entries = await Promise.all(
    dirents
      .filter((entry) => entry.isFile() && entry.name.endsWith('.mdx'))
      .map(async (entry) => {
        const slug = entry.name.replace(/\.mdx$/, '');
        const frontMatter = await readFrontMatter(slug);
        return {
          slug,
          path: slug === 'index' ? '/' : `/${slug}`,
          title: frontMatter.title,
          order: order.includes(slug) ? order.indexOf(slug) : Number.POSITIVE_INFINITY,
        } satisfies ArticleEntry;
      }),
  );

  entries.sort((left, right) => left.order - right.order || left.slug.localeCompare(right.slug));

  return {
    siteTitle: meta.title ?? 'ALEV-1 ドキュメント',
    entries,
  };
}

export const scanArticles = cache(scanArticlesImpl);

export async function loadArticleSource(slug: string) {
  const source = await readFile(path.join(contentRoot, `${slug}.mdx`), 'utf8');
  return matter(source);
}

export async function getArticleEntry(slug: string) {
  const { entries } = await scanArticles();
  return entries.find((entry) => entry.slug === slug) ?? null;
}

export async function getAdjacentArticles(slug: string) {
  const { entries } = await scanArticles();
  const currentIndex = entries.findIndex((entry) => entry.slug === slug);

  return {
    prev: currentIndex > 0 ? entries[currentIndex - 1] : null,
    next: currentIndex >= 0 && currentIndex < entries.length - 1 ? entries[currentIndex + 1] : null,
  };
}
