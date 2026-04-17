import type { FC, ReactNode } from 'react';

import { getAlevData } from '@/lib/alev';
import { getCorpusUsageCounts } from '@/lib/corpus';

import AlevGlyphDataProvider from './AlevGlyphDataProvider';
import { buildRenderableGlyphs } from './glyph-renderable';

type AlevGlyphDataBoundaryProps = {
  children: ReactNode;
};

const AlevGlyphDataBoundary: FC<AlevGlyphDataBoundaryProps> = (props) => {
  const { children } = props;
  const { glyphs } = getAlevData();
  const usageCounts = getCorpusUsageCounts();

  return (
    <AlevGlyphDataProvider
      glyphs={buildRenderableGlyphs(glyphs)}
      usageCounts={usageCounts}
    >
      {children}
    </AlevGlyphDataProvider>
  );
};

export default AlevGlyphDataBoundary;
