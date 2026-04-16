import type { FC } from 'react';

import { getAlevData } from '@/lib/alev';
import { getCorpusUsageCounts } from '@/lib/corpus';

import { buildRenderableGlyphs } from './glyph-renderable';
import GlyphMatrixClient from './GlyphMatrixClient';

type GlyphMatrixProps = {
  rowFilter?: string;
};

function normalizeRowFilter(value?: string): string[] | null {
  if (value == null || value === '') {
    return null;
  }

  const tokens = String(value)
    .split(',')
    .map((token) => token.trim().toUpperCase());

  if (tokens.length === 0 || tokens.some((token) => !/^[0-9A-F]$/.test(token))) {
    throw new Error(`GlyphMatrix rowFilter must be a comma-separated list of hex digits, received "${value}".`);
  }

  return [...new Set(tokens)];
}

const GlyphMatrix: FC<GlyphMatrixProps> = props => {
  const { glyphs, rows, cols } = getAlevData();
  const usageCounts = getCorpusUsageCounts();
  const rowFilter = normalizeRowFilter(props.rowFilter);
  const visibleRows = rowFilter ?? rows;

  return (
    <GlyphMatrixClient
      glyphs={buildRenderableGlyphs(glyphs)}
      rows={visibleRows}
      cols={cols}
      usageCounts={usageCounts}
    />
  );
};

export default GlyphMatrix;
