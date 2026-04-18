import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import DocsShell from '@/components/DocsShell';
import RichText from '@/components/RichText';
import { getAdjacentArticles, getArticleEntry, loadArticleSource, scanArticles } from '@/lib/articles';
import { renderMdx } from '@/lib/mdx';
import { createPageMetadata } from '@/lib/site';

export async function generateStaticParams() {
  const { entries } = await scanArticles();
  return entries.filter((entry) => entry.slug !== 'index').map((entry) => ({ slug: entry.slug }));
}

export const dynamicParams = false;

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params;
  const entry = await getArticleEntry(slug);
  return entry ? createPageMetadata(entry.title, entry.path) : {};
}

const ArticlePage = async (props: { params: Promise<{ slug: string }> }) => {
  const { slug } = await props.params;
  const [entry, article, { entries }, { prev, next }] = await Promise.all([
    getArticleEntry(slug),
    loadArticleSource(slug).catch(() => null),
    scanArticles(),
    getAdjacentArticles(slug),
  ]);

  if (!entry || !article) {
    notFound();
  }

  const content = await renderMdx(article.content);

  return (
    <DocsShell current={entry} entries={entries} prev={prev} next={next}>
      <RichText>{content}</RichText>
    </DocsShell>
  );
};

export default ArticlePage;
