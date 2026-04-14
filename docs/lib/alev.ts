import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { cache } from 'react';
import YAML from 'yaml';

import {
  binaryToHex,
  glyphCharForHex,
  normalizeAlevToken,
  resolveAlevTokenHex,
} from './alev-tokens';

export type ManifestGlyphRecord = {
  binary: string;
  hex: string;
  glyphName: string;
  codepoint: string;
  char: string;
  bits: boolean[];
};

export type GlyphRecord = ManifestGlyphRecord & {
  keywords: string[];
  label?: string | null;
  description?: string | null;
  notes?: string | null;
  comment?: string | null;
};

export type DictionaryEntry = {
  keyword: string;
  glyph: GlyphRecord;
  synonyms: string[];
};

export type AlevData = {
  familyName: string;
  glyphCount: number;
  glyphs: GlyphRecord[];
  rows: string[];
  cols: string[];
  dictionaryEntries: DictionaryEntry[];
};

type Manifest = {
  familyName: string;
  glyphCount: number;
  glyphs: ManifestGlyphRecord[];
};

type LexiconEntry = {
  binary?: string;
  keywords?: string[];
  label?: string | null;
  description?: string | null;
  notes?: string | null;
  comment?: string | null;
};

function resolveRepoDir(): string {
  const candidates = [process.cwd(), path.resolve(process.cwd(), '..')];

  for (const candidate of candidates) {
    const manifestPath = path.join(candidate, 'font', 'dist', 'manifest.json');
    const lexiconPath = path.join(candidate, 'data', 'lexicon.yaml');
    if (existsSync(manifestPath) && existsSync(lexiconPath)) {
      return candidate;
    }
  }

  throw new Error('Could not resolve repository root for docs/lib/alev.ts');
}

const repoDir = resolveRepoDir();
const manifestPath = path.join(repoDir, 'font', 'dist', 'manifest.json');
const lexiconPath = path.join(repoDir, 'data', 'lexicon.yaml');

const loadManifest = cache(() => {
  return JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
});

const loadLexicon = cache(() => {
  const source = readFileSync(lexiconPath, 'utf8');
  const parsed = YAML.parse(source) as { entries?: LexiconEntry[] };
  return Array.isArray(parsed?.entries) ? parsed.entries : [];
});

export { binaryToHex, glyphCharForHex, normalizeAlevToken, resolveAlevTokenHex };

export const getKeywordMap = cache(() => {
  const keywordMap = new Map<string, string>();

  for (const entry of loadLexicon()) {
    const binary = String(entry.binary ?? '').trim();
    if (!/^[01]{8}$/.test(binary)) {
      continue;
    }

    const hex = binaryToHex(binary);
    const keywords = Array.isArray(entry.keywords) ? entry.keywords : [];
    for (const keyword of keywords) {
      keywordMap.set(String(keyword), hex);
    }
  }

  return keywordMap;
});

function getLexiconMap(): Map<string, Omit<GlyphRecord, keyof ManifestGlyphRecord>> {
  const lexiconMap = new Map<string, Omit<GlyphRecord, keyof ManifestGlyphRecord>>();

  for (const entry of loadLexicon()) {
    const binary = String(entry.binary ?? '').trim();
    if (!/^[01]{8}$/.test(binary)) {
      continue;
    }

    const hex = binaryToHex(binary);
    lexiconMap.set(hex, {
      keywords: Array.isArray(entry.keywords) ? entry.keywords.map((keyword) => String(keyword)) : [],
      label: entry.label ? String(entry.label) : null,
      description: entry.description ? String(entry.description) : null,
      notes: entry.notes ? String(entry.notes) : null,
      comment: entry.comment ? String(entry.comment) : null,
    });
  }

  return lexiconMap;
}

export function renderAlevContent(source: string, keywordMap = getKeywordMap()): string {
  const trimmed = String(source ?? '').trim();
  if (!trimmed) {
    return '';
  }

  return trimmed
    .split(/\s+/)
    .map((token) => normalizeAlevToken(token, keywordMap))
    .join(' ');
}

export const getAlevData = cache((): AlevData => {
  const manifest = loadManifest();
  const lexiconMap = getLexiconMap();
  const glyphs = manifest.glyphs.map((glyph) => ({
    ...glyph,
    ...(lexiconMap.get(glyph.hex) ?? {
      keywords: [],
      label: null,
      description: null,
      notes: null,
      comment: null,
    }),
  }));
  const dictionaryEntries = glyphs
    .flatMap((glyph) =>
      glyph.keywords.map((keyword) => ({
        keyword,
        glyph,
        synonyms: glyph.keywords.filter((entry) => entry !== keyword),
      })),
    )
    .sort((left, right) => left.keyword.localeCompare(right.keyword));

  return {
    familyName: manifest.familyName,
    glyphCount: manifest.glyphCount,
    glyphs,
    rows: '0123456789ABCDEF'.split(''),
    cols: '0123456789ABCDEF'.split(''),
    dictionaryEntries,
  };
});
