import { getAlevData, getKeywordMap } from '@/lib/alev';
import { getCorpusUsageCounts, loadCorpusDocument } from '@/lib/corpus';

import CorpusViewClient, {
  type CorpusRenderableItem,
  type CorpusRenderableSection,
} from './CorpusViewClient';
import InlineMdx from './InlineMdx';
import { buildRenderableLine } from './alev-renderable';
import { buildRenderableGlyphs } from './glyph-renderable';

const buildRenderableSections = (): CorpusRenderableSection[] => {
  const document = loadCorpusDocument();
  const { glyphs } = getAlevData();
  const keywordMap = getKeywordMap();
  const glyphHexSet = new Set(glyphs.map((glyph) => glyph.hex));

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
  const { glyphs } = getAlevData();
  const usageCounts = getCorpusUsageCounts();
  const sections = buildRenderableSections();

  return <CorpusViewClient glyphs={buildRenderableGlyphs(glyphs)} sections={sections} usageCounts={usageCounts} />;
}

export default CorpusView;
