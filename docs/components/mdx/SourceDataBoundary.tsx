import type { FC, ReactNode } from 'react';

import { loadSourceData } from '@/lib/source-data';

import InlineMdx from './InlineMdx';
import SourceDataProvider, {
  type RenderableGlyphRecord,
} from './SourceDataProvider';

type SourceDataBoundaryProps = {
  children: ReactNode;
};

const SourceDataBoundary: FC<SourceDataBoundaryProps> = (props) => {
  const sourceData = loadSourceData();
  const glyphs: RenderableGlyphRecord[] = sourceData.glyphs.map((glyph) => ({
    ...glyph,
    commentContent: glyph.comment ? (
      <InlineMdx source={glyph.comment} staticAlev />
    ) : null,
  }));

  return (
    <SourceDataProvider sourceData={sourceData} glyphs={glyphs}>
      {props.children}
    </SourceDataProvider>
  );
};

export default SourceDataBoundary;
