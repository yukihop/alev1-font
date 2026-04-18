import type {
  CorpusDocument,
  LexiconGlyphRecord,
} from '@alev/data';

export type KeywordMap = Record<string, string>;

export type TokenizedAlevFragment =
  | {
      type: 'space';
      value: string;
    }
  | {
      type: 'bracket';
      value: '[' | ']';
    }
  | {
      type: 'token';
      value: string;
      resolvedBinary: string | null;
    };

export type UsageCounts = Record<string, number>;

const ALEV_CODEPOINT_BASE = 0xe000;
const TOKEN_PATTERN = /(\s+|\[|\])/;

export const HEX_DIGITS = '0123456789ABCDEF'.split('');

export function binaryToHex(binary: string): string {
  return Number.parseInt(binary, 2)
    .toString(16)
    .toUpperCase()
    .padStart(2, '0');
}

export function hexToBinary(hex: string): string {
  return Number.parseInt(hex, 16).toString(2).padStart(8, '0');
}

export function glyphCharForBinary(binary: string): string {
  return String.fromCodePoint(ALEV_CODEPOINT_BASE + Number.parseInt(binary, 2));
}

export function codepointLabelForBinary(binary: string): string {
  return `U+${(ALEV_CODEPOINT_BASE + Number.parseInt(binary, 2))
    .toString(16)
    .toUpperCase()
    .padStart(4, '0')}`;
}

export function buildKeywordMap(
  lexicon: Map<string, LexiconGlyphRecord>,
): KeywordMap {
  const keywordMap: KeywordMap = {};

  for (const entry of lexicon.values()) {
    for (const keyword of entry.keywords) {
      keywordMap[keyword] = entry.binary;
    }
  }

  return keywordMap;
}

export function resolveAlevTokenBinary(
  token: string,
  keywordMap: KeywordMap,
): string | null {
  const normalized = String(token ?? '').trim();
  if (!normalized) {
    return null;
  }

  if (/^0x[0-9a-f]{2}$/i.test(normalized)) {
    return hexToBinary(normalized.slice(2));
  }

  if (/^0b[01]{8}$/i.test(normalized)) {
    return normalized.slice(2);
  }

  return keywordMap[normalized] ?? null;
}

export function normalizeAlevToken(
  token: string,
  keywordMap: KeywordMap,
): string {
  const resolvedBinary = resolveAlevTokenBinary(token, keywordMap);
  return resolvedBinary ? glyphCharForBinary(resolvedBinary) : token;
}

export function tokenizeAlevLine(
  line: string,
  keywordMap: KeywordMap,
): TokenizedAlevFragment[] {
  return String(line ?? '')
    .split(TOKEN_PATTERN)
    .filter((fragment) => fragment.length > 0)
    .map((fragment) => {
      if (fragment.trim().length === 0) {
        return {
          type: 'space',
          value: fragment,
        } satisfies TokenizedAlevFragment;
      }

      if (fragment === '[' || fragment === ']') {
        return {
          type: 'bracket',
          value: fragment,
        } satisfies TokenizedAlevFragment;
      }

      return {
        type: 'token',
        value: fragment,
        resolvedBinary: resolveAlevTokenBinary(fragment, keywordMap),
      } satisfies TokenizedAlevFragment;
    });
}

export function collectUsageCounts(
  corpus: CorpusDocument,
  keywordMap: KeywordMap,
): UsageCounts {
  const usageCounts: UsageCounts = {};

  for (const section of corpus.sections) {
    for (const item of section.items) {
      if (item.type !== 'entry' || item.alevLines === null) {
        continue;
      }

      for (const line of item.alevLines) {
        for (const fragment of tokenizeAlevLine(line, keywordMap)) {
          if (fragment.type !== 'token' || !fragment.resolvedBinary) {
            continue;
          }

          usageCounts[fragment.resolvedBinary] =
            (usageCounts[fragment.resolvedBinary] ?? 0) + 1;
        }
      }
    }
  }

  return usageCounts;
}
