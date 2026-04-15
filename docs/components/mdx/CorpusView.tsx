import type { FC } from 'react';

import { getAlevData, getKeywordMap } from '@/lib/alev';
import { getCorpusUsageCounts, loadCorpusDocument } from '@/lib/corpus';

import CorpusViewClient, {
  type CorpusRenderableItem,
  type CorpusRenderableSection,
} from './CorpusViewClient';
import { buildRenderableComment, buildRenderableLine } from './alev-renderable';

const CorpusView: FC = () => {
  const document = loadCorpusDocument();
  const { glyphs } = getAlevData();
  const keywordMap = getKeywordMap();
  const usageCounts = getCorpusUsageCounts();
  const glyphHexSet = new Set(glyphs.map((glyph) => glyph.hex));
  const sections: CorpusRenderableSection[] = document.sections.map((section) => ({
    title: section.title,
    items: section.items.map((item): CorpusRenderableItem => {
      if (item.type === 'paragraph') {
        return {
          type: 'paragraph',
          content: buildRenderableComment(item.text, keywordMap, glyphHexSet),
        };
      }

      return {
        type: 'entry',
        position: item.position,
        japanese: item.japanese,
        alevLines:
          item.alevLines === null
            ? null
            : item.alevLines.map((line) =>
                buildRenderableLine(line, keywordMap, glyphHexSet),
              ),
        comments: item.comments.map((comment) =>
          buildRenderableComment(comment, keywordMap, glyphHexSet),
        ),
      };
    }),
  }));

  return <CorpusViewClient glyphs={glyphs} sections={sections} usageCounts={usageCounts} />;
};

export default CorpusView;
