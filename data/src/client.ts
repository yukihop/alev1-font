export type KeywordLookup = Record<string, string>;

export type AlevLineFragment =
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
      resolvedHex: string | null;
    };

const ALEV_CODEPOINT_BASE = 0xe000;
const TOKEN_PATTERN = /(\s+|\[|\])/;

export function binaryToHex(binary: string): string {
  return Number.parseInt(binary, 2)
    .toString(16)
    .toUpperCase()
    .padStart(2, '0');
}

export function glyphCharForHex(hex: string): string {
  return String.fromCodePoint(ALEV_CODEPOINT_BASE + Number.parseInt(hex, 16));
}

export function resolveAlevTokenHex(
  token: string,
  keywordLookup: KeywordLookup,
): string | null {
  const normalized = String(token ?? '').trim();
  if (!normalized) {
    return null;
  }

  if (/^0x[0-9a-f]{2}$/i.test(normalized)) {
    return normalized.slice(2).toUpperCase();
  }

  if (/^0b[01]{8}$/i.test(normalized)) {
    return binaryToHex(normalized.slice(2));
  }

  return keywordLookup[normalized] ?? null;
}

export function normalizeAlevToken(
  token: string,
  keywordLookup: KeywordLookup,
): string {
  const resolvedHex = resolveAlevTokenHex(token, keywordLookup);
  return resolvedHex ? glyphCharForHex(resolvedHex) : token;
}

export function tokenizeAlevLine(
  line: string,
  keywordLookup: KeywordLookup,
): AlevLineFragment[] {
  return String(line ?? '')
    .split(TOKEN_PATTERN)
    .filter((fragment) => fragment.length > 0)
    .map((fragment) => {
      if (fragment.trim().length === 0) {
        return {
          type: 'space',
          value: fragment,
        } satisfies AlevLineFragment;
      }

      if (fragment === '[' || fragment === ']') {
        return {
          type: 'bracket',
          value: fragment,
        } satisfies AlevLineFragment;
      }

      return {
        type: 'token',
        value: fragment,
        resolvedHex: resolveAlevTokenHex(fragment, keywordLookup),
      } satisfies AlevLineFragment;
    });
}
