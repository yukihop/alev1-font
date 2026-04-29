import {
  Fragment,
  cache,
  type ComponentPropsWithoutRef,
  type ReactElement,
} from 'react';
import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';

import AlevLine from '@/components/mdx/AlevLine';
import AlevInline from '@/components/mdx/AlevInline';
import AlevSignalDemo from '@/components/mdx/AlevSignalDemoClient';
import CorpusView from '@/components/mdx/CorpusView';
import GlyphList from '@/components/mdx/GlyphList';
import GlyphMatrix from '@/components/mdx/GlyphMatrix';
import HomeMenu, {
  HomeMenuCard,
  HomeMenuSection,
} from '@/components/mdx/HomeMenu';
import LayeredGlyph from '@/components/mdx/LayeredGlyph';
import LayeredGlyphSequence from '@/components/mdx/LayeredGlyphSequence';
import SimpleEditor from '@/components/mdx/SimpleEditorClient';
import { StaticAlevInline } from '@/components/mdx/AlevInline';
import { remarkAlevInline } from '@/lib/remark-alev-inline';

const components = {
  AlevLine,
  AlevInline,
  AlevSignalDemo,
  GlyphMatrix,
  GlyphList,
  HomeMenu,
  HomeMenuCard,
  HomeMenuSection,
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

type InlineMdxComponents = typeof inlineComponents & {
  a: (props: ComponentPropsWithoutRef<'a'>) => ReactElement;
};

function resolveHashHref(
  href: string | undefined,
  hashLinkBase: string | undefined,
): string | undefined {
  if (!href || !hashLinkBase || !href.startsWith('#')) {
    return href;
  }

  return `${hashLinkBase}${href}`;
}

function createInlineComponents(
  baseComponents: typeof inlineComponents | typeof staticInlineComponents,
  hashLinkBase?: string,
): InlineMdxComponents {
  return {
    ...baseComponents,
    a: ({ href, ...props }) => (
      <a {...props} href={resolveHashHref(href, hashLinkBase)} />
    ),
  };
}

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
  componentsMap: InlineMdxComponents,
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

export const renderInlineMdx = cache(
  async (source: string, hashLinkBase?: string) => {
    return compileInlineMdx(
      source,
      createInlineComponents(inlineComponents, hashLinkBase),
    );
  },
);

export const renderStaticInlineMdx = cache(
  async (source: string, hashLinkBase?: string) => {
    return compileInlineMdx(
      source,
      createInlineComponents(staticInlineComponents, hashLinkBase),
    );
  },
);
