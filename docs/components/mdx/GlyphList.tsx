import type { FC } from 'react';

import { getAlevData } from '@/lib/alev';

import GlyphListClient from './GlyphListClient';

const GlyphList: FC = () => {
  const { glyphs } = getAlevData();
  return <GlyphListClient glyphs={glyphs} />;
};

export default GlyphList;
