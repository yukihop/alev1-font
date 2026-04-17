import { Fragment, cache } from 'react';
import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';

import AlevLine from '@/components/mdx/AlevLine';
import AlevInline from '@/components/mdx/AlevInline';
import AlevSignalDemo from '@/components/mdx/AlevSignalDemo';
import CorpusView from '@/components/mdx/CorpusView';
import GlyphList from '@/components/mdx/GlyphList';
import GlyphMatrix from '@/components/mdx/GlyphMatrix';
import LayeredGlyph from '@/components/mdx/LayeredGlyph';
import LayeredGlyphSequence from '@/components/mdx/LayeredGlyphSequence';
import SimpleEditor from '@/components/mdx/SimpleEditor';
import { StaticAlevInline } from '@/components/mdx/AlevInline';
import { remarkAlevInline } from '@/lib/remark-alev-inline';

const components = {
  AlevLine,
  AlevInline,
  AlevSignalDemo,
  GlyphMatrix,
  GlyphList,
  LayeredGlyph,
  LayeredGlyphSequence,
  CorpusView,
  SimpleEditor,
  LigatureTester: SimpleEditor,
};

const inlineComponents = {
  AlevInline,
  p: Fragment,
};

const staticInlineComponents = {
  AlevInline: StaticAlevInline,
  p: Fragment,
};

export async function renderMdx(source: string) {
  const { content } = await compileMDX({
    source,
    components,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm, remarkAlevInline],
      },
    },
  });

  return content;
}

async function compileInlineMdx(
  source: string,
  componentsMap: typeof inlineComponents,
) {
  const normalizedSource = String(source ?? '').trim();
  if (!normalizedSource) {
    return null;
  }

  const { content } = await compileMDX({
    source: normalizedSource,
    components: componentsMap,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm, remarkAlevInline],
      },
    },
  });

  return content;
}

export const renderInlineMdx = cache(async (source: string) => {
  return compileInlineMdx(source, inlineComponents);
});

export const renderStaticInlineMdx = cache(async (source: string) => {
  return compileInlineMdx(source, staticInlineComponents);
});
