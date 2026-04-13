import { getAlevData } from '@/lib/alev';

import GlyphListClient from './GlyphListClient';

export default function GlyphList() {
  const { glyphs } = getAlevData();
  return <GlyphListClient glyphs={glyphs} />;
}
