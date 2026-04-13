import AlevInline from './mdx/AlevInline.tsx';
import ConceptDictionary from './mdx/ConceptDictionary.tsx';
import GlyphList from './mdx/GlyphList.tsx';
import GlyphMatrix from './mdx/GlyphMatrix.tsx';
import MarkdownEditor from './mdx/MarkdownEditor.tsx';
import SimpleEditor from './mdx/SimpleEditor.tsx';

export const mdxComponents = {
  AlevInline,
  GlyphMatrix,
  GlyphList,
  ConceptDictionary,
  MarkdownEditor,
  SimpleEditor,
  LigatureTester: SimpleEditor,
};
