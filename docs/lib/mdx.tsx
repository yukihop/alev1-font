import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';

import AlevLine from '@/components/mdx/AlevLine';
import AlevInline from '@/components/mdx/AlevInline';
import AlevSignalDemo from '@/components/mdx/AlevSignalDemo';
import ConceptDictionary from '@/components/mdx/ConceptDictionary';
import CorpusView from '@/components/mdx/CorpusView';
import GlyphList from '@/components/mdx/GlyphList';
import GlyphMatrix from '@/components/mdx/GlyphMatrix';
import LayeredGlyph from '@/components/mdx/LayeredGlyph';
import MarkdownEditor from '@/components/mdx/MarkdownEditor';
import SimpleEditor from '@/components/mdx/SimpleEditor';
import { remarkAlevInline } from '@/lib/remark-alev-inline';

const components = {
  AlevLine,
  AlevInline,
  AlevSignalDemo,
  GlyphMatrix,
  GlyphList,
  LayeredGlyph,
  ConceptDictionary,
  CorpusView,
  MarkdownEditor,
  SimpleEditor,
  LigatureTester: SimpleEditor,
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
