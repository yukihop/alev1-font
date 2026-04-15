import type { FC } from 'react';

import { getAlevData, getKeywordMap } from '@/lib/alev';
import { getCorpusUsageCounts, loadCorpusDocument } from '@/lib/corpus';

import CorpusViewClient, {
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
    entries: section.entries.map((entry) => ({
      position: entry.position,
      japanese: entry.japanese,
      alevLines:
        entry.alevLines === null
          ? null
          : entry.alevLines.map((line) =>
              buildRenderableLine(line, keywordMap, glyphHexSet),
            ),
      comments: entry.comments.map((comment) =>
        buildRenderableComment(comment, keywordMap, glyphHexSet),
      ),
    })),
  }));

  return <CorpusViewClient glyphs={glyphs} sections={sections} usageCounts={usageCounts} />;
};

export default CorpusView;
