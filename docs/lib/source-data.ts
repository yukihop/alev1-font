import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { cache } from 'react';

import {
  loadCorpusDocument,
  loadLexiconData,
  tokenizeAlevLine,
  type CorpusDocument,
  type KeywordLookup,
  type LexiconGlyphRecord,
} from '@alev/data';

export type ManifestGlyphRecord = {
  binary: string;
  hex: string;
  glyphName: string;
  codepoint: string;
  char: string;
  bits: boolean[];
};

export type SourceGlyphRecord = ManifestGlyphRecord & {
  keywords: string[];
  comment: string | null;
};

export type SourceData = {
  familyName: string;
  styleName: string;
  outputFileBase: string;
  glyphCount: number;
  rows: string[];
  cols: string[];
  glyphs: SourceGlyphRecord[];
  keywordMap: KeywordLookup;
  corpus: CorpusDocument;
  usageCounts: Record<string, number>;
  usedGlyphCount: number;
};

type Manifest = {
  familyName: string;
  styleName: string;
  outputFileBase: string;
  glyphCount: number;
  glyphs: ManifestGlyphRecord[];
};

const HEX_DIGITS = '0123456789ABCDEF'.split('');

function resolveRepoDir(): string {
  const candidates = [process.cwd(), path.resolve(process.cwd(), '..')];

  for (const candidate of candidates) {
    const manifestPath = path.join(candidate, 'font', 'dist', 'manifest.json');
    const lexiconPath = path.join(candidate, 'data', 'lexicon.txt');
    const corpusPath = path.join(candidate, 'data', 'corpus.txt');
    if (
      existsSync(manifestPath) &&
      existsSync(lexiconPath) &&
      existsSync(corpusPath)
    ) {
      return candidate;
    }
  }

  throw new Error('Could not resolve repository root for docs/lib/source-data.ts');
}

const repoDir = resolveRepoDir();
const manifestPath = path.join(repoDir, 'font', 'dist', 'manifest.json');

function buildKeywordMap(lexicon: Map<string, LexiconGlyphRecord>): KeywordLookup {
  const keywordMap: KeywordLookup = {};

  for (const entry of lexicon.values()) {
    for (const keyword of entry.keywords) {
      keywordMap[keyword] = entry.hex;
    }
  }

  return keywordMap;
}

function collectUsageCounts(
  corpus: CorpusDocument,
  keywordMap: KeywordLookup,
): Record<string, number> {
  const usageCounts: Record<string, number> = {};

  for (const section of corpus.sections) {
    for (const item of section.items) {
      if (item.type !== 'entry' || item.alevLines === null) {
        continue;
      }

      for (const line of item.alevLines) {
        for (const fragment of tokenizeAlevLine(line, keywordMap)) {
          if (fragment.type !== 'token' || !fragment.resolvedHex) {
            continue;
          }

          usageCounts[fragment.resolvedHex] =
            (usageCounts[fragment.resolvedHex] ?? 0) + 1;
        }
      }
    }
  }

  return usageCounts;
}

const loadManifest = cache((): Manifest => {
  return JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
});

export const loadSourceData = cache((): SourceData => {
  const manifest = loadManifest();
  const lexicon = loadLexiconData();
  const corpus = loadCorpusDocument();
  const keywordMap = buildKeywordMap(lexicon);
  const usageCounts = collectUsageCounts(corpus, keywordMap);
  const glyphs = manifest.glyphs.map((glyph) => {
    const lexiconEntry = lexicon.get(glyph.hex);

    return {
      ...glyph,
      keywords: lexiconEntry?.keywords ?? [],
      comment: lexiconEntry?.comment ?? null,
    };
  });

  return {
    familyName: manifest.familyName,
    styleName: manifest.styleName,
    outputFileBase: manifest.outputFileBase,
    glyphCount: manifest.glyphCount,
    rows: HEX_DIGITS,
    cols: HEX_DIGITS,
    glyphs,
    keywordMap,
    corpus,
    usageCounts,
    usedGlyphCount: Object.keys(usageCounts).length,
  };
});
