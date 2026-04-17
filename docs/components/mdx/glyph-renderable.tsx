import type { ReactNode } from 'react';

import type { GlyphRecord } from '@/lib/alev';

import InlineMdx from './InlineMdx';

export type GlyphRenderableRecord = GlyphRecord & {
  commentContent: ReactNode | null;
};

export function buildRenderableGlyphs(glyphs: GlyphRecord[]): GlyphRenderableRecord[] {
  return glyphs.map((glyph) => ({
    ...glyph,
    commentContent: glyph.comment ? <InlineMdx source={glyph.comment} staticAlev /> : null,
  }));
}
