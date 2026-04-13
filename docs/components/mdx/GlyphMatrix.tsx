import type { FC } from 'react';

import { getAlevData } from '@/lib/alev';

import GlyphMatrixClient from './GlyphMatrixClient';

const GlyphMatrix: FC = () => {
  const { glyphs, rows, cols } = getAlevData();
  return <GlyphMatrixClient glyphs={glyphs} rows={rows} cols={cols} />;
};

export default GlyphMatrix;
