import type { FC } from 'react';

import { getAlevData } from '@/lib/alev';
import { getCorpusUsageCounts } from '@/lib/corpus';

import GlyphMatrixClient from './GlyphMatrixClient';

const GlyphMatrix: FC = () => {
  const { glyphs, rows, cols } = getAlevData();
  const usageCounts = getCorpusUsageCounts();
  return <GlyphMatrixClient glyphs={glyphs} rows={rows} cols={cols} usageCounts={usageCounts} />;
};

export default GlyphMatrix;
