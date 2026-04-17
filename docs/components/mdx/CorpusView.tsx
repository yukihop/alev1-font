import { getGlyphHexSet, getKeywordMap } from '@/lib/alev';
import { loadCorpusDocument } from '@/lib/corpus';

import CorpusViewClient, {
  type CorpusRenderableItem,
  type CorpusRenderableSection,
} from './CorpusViewClient';
import InlineMdx from './InlineMdx';
import { buildRenderableLine } from './alev-renderable';

const buildRenderableSections = (): CorpusRenderableSection[] => {
  const document = loadCorpusDocument();
  const keywordMap = getKeywordMap();
  const glyphHexSet = getGlyphHexSet();

  return document.sections.map((section): CorpusRenderableSection => ({
      title: section.title,
      items: section.items.map((item): CorpusRenderableItem => {
          if (item.type === 'paragraph') {
            return {
              type: 'paragraph',
              content: <InlineMdx source={item.text} />,
            };
          }

          return {
            type: 'entry',
            position: item.position,
            anchor: item.anchor,
            japanese: item.japanese,
            alevLines:
              item.alevLines === null
                ? null
                : item.alevLines.map((line) =>
                    buildRenderableLine(line, keywordMap, glyphHexSet),
                  ),
            comments: item.comments.map((comment, commentIndex) => ({
                key: `${item.position}-comment-${commentIndex}`,
                content: <InlineMdx source={comment} />,
              })),
          };
        }),
    }));
};

async function CorpusView() {
  const sections = buildRenderableSections();

  return <CorpusViewClient sections={sections} />;
}

export default CorpusView;
