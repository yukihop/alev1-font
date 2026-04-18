import type { FC } from 'react';

import { HEX_DIGITS } from '@/lib/alev-shared';

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
  const rowFilter = normalizeNibbleFilter('rowFilter', props.rowFilter);
  const columnFilter = normalizeNibbleFilter('columnFilter', props.columnFilter);
  const visibleRows = rowFilter ?? HEX_DIGITS;
  const visibleCols = columnFilter ?? HEX_DIGITS;

  return <GlyphMatrixClient rows={visibleRows} cols={visibleCols} />;
};

export default GlyphMatrix;
