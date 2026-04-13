import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import YAML from 'yaml';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function resolveRepoDir(): string {
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), '..'),
    path.resolve(__dirname, '..', '..'),
    path.resolve(__dirname, '..', '..', '..'),
  ];

  for (const candidate of candidates) {
    const manifestPath = path.join(candidate, 'font', 'dist', 'manifest.json');
    const lexiconPath = path.join(candidate, 'data', 'lexicon.yaml');
    if (existsSync(manifestPath) && existsSync(lexiconPath)) {
      return candidate;
    }
  }

  throw new Error('Could not resolve repository root for docs/_config/alev.ts');
}

const REPO_DIR = resolveRepoDir();
const MANIFEST_PATH = path.join(REPO_DIR, 'font', 'dist', 'manifest.json');
const LEXICON_PATH = path.join(REPO_DIR, 'data', 'lexicon.yaml');

let manifestCache: Manifest | null = null;
let lexiconCache: LexiconEntry[] | null = null;

function loadManifest(): Manifest {
  if (!manifestCache) {
    manifestCache = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;
  }

  return manifestCache;
}

function loadLexicon() {
  if (!lexiconCache) {
    const source = readFileSync(LEXICON_PATH, 'utf8');
    const parsed = YAML.parse(source) as { entries?: LexiconEntry[] };
    lexiconCache = Array.isArray(parsed?.entries) ? parsed.entries : [];
  }

  return lexiconCache;
}

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

export function binaryToHex(binary: string): string {
  return Number.parseInt(binary, 2).toString(16).toUpperCase().padStart(2, '0');
}

export function getKeywordMap(): Map<string, string> {
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
}

export function normalizeAlevToken(token: string, keywordMap = getKeywordMap()): string {
  if (/^0x[0-9a-f]{2}$/i.test(token)) {
    return `0x${token.slice(2).toUpperCase()}`;
  }

  if (/^0b[01]{8}$/i.test(token)) {
    return `0x${binaryToHex(token.slice(2))}`;
  }

  return keywordMap.get(token) ? `0x${keywordMap.get(token)}` : token;
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

export function getAlevData(): AlevData {
  const manifest = loadManifest();
  const lexiconMap = getLexiconMap();
  const glyphs = (Array.isArray(manifest.glyphs) ? manifest.glyphs : []).map((glyph) => ({
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
}

export function getManifestMeta() {
  const manifest = loadManifest();
  return {
    familyName: manifest.familyName,
    glyphCount: manifest.glyphCount,
  };
}
