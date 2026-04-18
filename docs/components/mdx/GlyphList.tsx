import type { FC } from 'react';

import { loadLexicon, loadUsageCounts } from '@/lib/alev';

import GlyphListClient from './GlyphListClient';
import { createRenderableGlyphRecord } from './glyph-record';

const GlyphList: FC = () => {
  const lexicon = loadLexicon();
  const usageCounts = loadUsageCounts();
  const glyphs = Object.keys(usageCounts)
    .sort((left, right) => left.localeCompare(right))
    .map((binary) =>
      createRenderableGlyphRecord(
        binary,
        lexicon.get(binary),
        usageCounts[binary] ?? 0,
      ),
    );

  return <GlyphListClient glyphs={glyphs} />;
};

export default GlyphList;
