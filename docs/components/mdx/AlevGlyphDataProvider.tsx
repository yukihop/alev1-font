'use client';

import {
  createContext,
  useContext,
  useMemo,
  type FC,
  type ReactNode,
} from 'react';

import type { GlyphRenderableRecord } from './glyph-renderable';

type AlevGlyphDataContextValue = {
  glyphMap: Map<string, GlyphRenderableRecord>;
  usageCounts: Record<string, number>;
};

const AlevGlyphDataContext = createContext<AlevGlyphDataContextValue | null>(
  null,
);

type AlevGlyphDataProviderProps = {
  glyphs: GlyphRenderableRecord[];
  usageCounts: Record<string, number>;
  children: ReactNode;
};

const AlevGlyphDataProvider: FC<AlevGlyphDataProviderProps> = (props) => {
  const { glyphs, usageCounts, children } = props;
  const value = useMemo<AlevGlyphDataContextValue>(
    () => ({
      glyphMap: new Map(glyphs.map((glyph) => [glyph.hex, glyph])),
      usageCounts,
    }),
    [glyphs, usageCounts],
  );

  return (
    <AlevGlyphDataContext.Provider value={value}>
      {children}
    </AlevGlyphDataContext.Provider>
  );
};

export function useAlevGlyphData(): AlevGlyphDataContextValue {
  const value = useContext(AlevGlyphDataContext);
  if (!value) {
    throw new Error(
      'useAlevGlyphData must be used within AlevGlyphDataProvider.',
    );
  }

  return value;
}

export default AlevGlyphDataProvider;
