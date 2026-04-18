import type { LexiconGlyphRecord } from '@alev/data';

import {
  binaryToHex,
  codepointLabelForBinary,
  glyphCharForBinary,
} from '@/lib/alev-shared';

export type DocsGlyphRecord = {
  binary: string;
  hex: string;
  codepoint: string;
  char: string;
  keywords: string[];
  comment: string | null;
};

export type RenderableGlyphRecord = DocsGlyphRecord & {
  usageCount: number;
};

export function createGlyphRecord(
  binary: string,
  entry?: LexiconGlyphRecord | null,
): DocsGlyphRecord {
  return {
    binary,
    hex: binaryToHex(binary),
    codepoint: codepointLabelForBinary(binary),
    char: glyphCharForBinary(binary),
    keywords: entry?.keywords ?? [],
    comment: entry?.comment ?? null,
  };
}

export function createRenderableGlyphRecord(
  binary: string,
  entry?: LexiconGlyphRecord | null,
  usageCount = 0,
): RenderableGlyphRecord {
  const glyph = createGlyphRecord(binary, entry);

  return {
    ...glyph,
    usageCount,
  };
}
