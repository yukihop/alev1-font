import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';

import AlevInline from '@/components/mdx/AlevInline';
import AlevSignalDemo from '@/components/mdx/AlevSignalDemo';
import ConceptDictionary from '@/components/mdx/ConceptDictionary';
import GlyphList from '@/components/mdx/GlyphList';
import GlyphMatrix from '@/components/mdx/GlyphMatrix';
import MarkdownEditor from '@/components/mdx/MarkdownEditor';
import SimpleEditor from '@/components/mdx/SimpleEditor';
import { remarkAlevInline } from '@/lib/remark-alev-inline';

const components = {
  AlevInline,
  AlevSignalDemo,
  GlyphMatrix,
  GlyphList,
  ConceptDictionary,
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
