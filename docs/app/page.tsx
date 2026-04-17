import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import DocsShell from '@/components/DocsShell';
import RichText from '@/components/RichText';
import SourceDataBoundary from '@/components/mdx/SourceDataBoundary';
import { getAdjacentArticles, getArticleEntry, loadArticleSource, scanArticles } from '@/lib/articles';
import { renderMdx } from '@/lib/mdx';

export async function generateMetadata(): Promise<Metadata> {
  const entry = await getArticleEntry('index');
  return entry ? { title: entry.title } : {};
}

const HomePage = async () => {
  const [entry, article, { entries }, { prev, next }] = await Promise.all([
    getArticleEntry('index'),
    loadArticleSource('index').catch(() => null),
    scanArticles(),
    getAdjacentArticles('index'),
  ]);

  if (!entry || !article) {
    notFound();
  }

  const content = await renderMdx(article.content);

  return (
    <DocsShell current={entry} entries={entries} prev={prev} next={next}>
      <SourceDataBoundary>
        <RichText>{content}</RichText>
      </SourceDataBoundary>
    </DocsShell>
  );
};

export default HomePage;
