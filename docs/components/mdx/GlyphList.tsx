import type { FC } from 'react';

import { getAlevData } from '@/lib/alev';
import { getCorpusUsageCounts } from '@/lib/corpus';

import { buildRenderableGlyphs } from './glyph-renderable';
import GlyphListClient from './GlyphListClient';

const GlyphList: FC = () => {
  const { glyphs } = getAlevData();
  const usageCounts = getCorpusUsageCounts();
  const visibleGlyphs = buildRenderableGlyphs(
    glyphs.filter((glyph) => (usageCounts[glyph.hex] ?? 0) > 0),
  );

  return <GlyphListClient glyphs={visibleGlyphs} usageCounts={usageCounts} />;
};

export default GlyphList;
