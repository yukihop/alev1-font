import type { ReactNode } from 'react';

import type { LexiconGlyphRecord } from '@alev/data';

import {
  binaryToHex,
  codepointLabelForBinary,
  glyphCharForBinary,
} from '@/lib/alev-shared';

import InlineMdx from './InlineMdx';

export type DocsGlyphRecord = {
  binary: string;
  hex: string;
  codepoint: string;
  char: string;
  keywords: string[];
  comment: string | null;
};

export type RenderableGlyphRecord = DocsGlyphRecord & {
  commentContent: ReactNode | null;
  usageCount: number;
};

export type RenderableGlyphMap = Record<string, RenderableGlyphRecord>;

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
    commentContent: glyph.comment ? (
      <InlineMdx source={glyph.comment} staticAlev />
    ) : null,
  };
}

export function createRenderableGlyphMap(
  binaries: Iterable<string>,
  resolveEntry: (binary: string) => LexiconGlyphRecord | undefined,
  usageCounts: Record<string, number>,
): RenderableGlyphMap {
  const glyphByBinary: RenderableGlyphMap = {};

  for (const binary of binaries) {
    glyphByBinary[binary] = createRenderableGlyphRecord(
      binary,
      resolveEntry(binary),
      usageCounts[binary] ?? 0,
    );
  }

  return glyphByBinary;
}
