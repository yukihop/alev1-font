'use client';

import {
  createContext,
  useContext,
  useMemo,
  type FC,
  type ReactNode,
} from 'react';

import type { SourceData, SourceGlyphRecord } from '@/lib/source-data';

export type RenderableGlyphRecord = SourceGlyphRecord & {
  commentContent: ReactNode | null;
};

type SourceDataContextValue = {
  sourceData: SourceData;
  glyphs: RenderableGlyphRecord[];
  glyphMap: Map<string, RenderableGlyphRecord>;
};

const SourceDataContext = createContext<SourceDataContextValue | null>(null);

type SourceDataProviderProps = {
  sourceData: SourceData;
  glyphs: RenderableGlyphRecord[];
  children: ReactNode;
};

const SourceDataProvider: FC<SourceDataProviderProps> = (props) => {
  const { sourceData, glyphs, children } = props;
  const value = useMemo<SourceDataContextValue>(
    () => ({
      sourceData,
      glyphs,
      glyphMap: new Map(glyphs.map((glyph) => [glyph.hex, glyph])),
    }),
    [glyphs, sourceData],
  );

  return (
    <SourceDataContext.Provider value={value}>
      {children}
    </SourceDataContext.Provider>
  );
};

export function useSourceData(): SourceDataContextValue {
  const value = useContext(SourceDataContext);
  if (!value) {
    throw new Error('useSourceData must be used within SourceDataProvider.');
  }

  return value;
}

export default SourceDataProvider;
