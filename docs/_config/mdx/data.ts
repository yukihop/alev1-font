import { getAlevData, type GlyphRecord } from '../alev.ts';

export const alev = getAlevData();
export const glyphMap = new Map<string, GlyphRecord>(alev.glyphs.map((glyph) => [glyph.hex, glyph]));
