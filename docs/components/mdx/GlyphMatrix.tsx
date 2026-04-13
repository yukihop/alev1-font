import { getAlevData } from '@/lib/alev';

import GlyphMatrixClient from './GlyphMatrixClient';

export default function GlyphMatrix() {
  const { glyphs, rows, cols } = getAlevData();
  return <GlyphMatrixClient glyphs={glyphs} rows={rows} cols={cols} />;
}
