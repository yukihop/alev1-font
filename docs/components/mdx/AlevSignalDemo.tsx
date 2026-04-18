import type { FC } from 'react';

import { loadLexicon } from '@/lib/alev';

import AlevSignalDemoClient from './AlevSignalDemoClient';
import { createGlyphRecord } from './glyph-record';

const AlevSignalDemo: FC = () => {
  const glyphs = Array.from(loadLexicon().values()).map((entry) =>
    createGlyphRecord(entry.binary, entry),
  );

  if (glyphs.length === 0) {
    return null;
  }

  return <AlevSignalDemoClient glyphs={glyphs} />;
};

export default AlevSignalDemo;
