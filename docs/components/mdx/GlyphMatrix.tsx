import type { FC } from 'react';

import { getAlevData } from '@/lib/alev';
import { getCorpusUsageCounts } from '@/lib/corpus';

import { buildRenderableGlyphs } from './glyph-renderable';
import GlyphMatrixClient from './GlyphMatrixClient';

type GlyphMatrixProps = {
  rowFilter?: string;
  columnFilter?: string;
};

function normalizeNibbleFilter(kind: 'rowFilter' | 'columnFilter', value?: string): string[] | null {
  if (value == null || value === '') {
    return null;
  }

  const tokens = String(value)
    .split(',')
    .map((token) => token.trim().toUpperCase());

  if (tokens.length === 0 || tokens.some((token) => !/^[0-9A-F]$/.test(token))) {
    throw new Error(`GlyphMatrix ${kind} must be a comma-separated list of hex digits, received "${value}".`);
  }

  return [...new Set(tokens)];
}

const GlyphMatrix: FC<GlyphMatrixProps> = props => {
  const { glyphs, rows, cols } = getAlevData();
  const usageCounts = getCorpusUsageCounts();
  const rowFilter = normalizeNibbleFilter('rowFilter', props.rowFilter);
  const columnFilter = normalizeNibbleFilter('columnFilter', props.columnFilter);
  const visibleRows = rowFilter ?? rows;
  const visibleCols = columnFilter ?? cols;

  return (
    <GlyphMatrixClient
      glyphs={buildRenderableGlyphs(glyphs)}
      rows={visibleRows}
      cols={visibleCols}
      usageCounts={usageCounts}
    />
  );
};

export default GlyphMatrix;
