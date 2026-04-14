export type KeywordMap = Record<string, string>;

export type SimpleEditorProps = {
  defaultValue?: string;
  defaultFontSize?: number;
  defaultLetterSpacing?: number;
};

export type SimpleEditorPanelProps = SimpleEditorProps & {
  keywordMap: KeywordMap;
};

export type VisualPreset = {
  value: string;
  label: string;
  background: string;
  color: string;
  shadowColor: string | null;
  sample: string;
};

export type CanonicalizeEditorResult =
  | {
      ok: true;
      text: string;
    }
  | {
      ok: false;
      reason: string;
      token?: string;
    };

export const DEFAULT_EDITOR_VALUE = 'i love straylight 0xFF';
export const DEFAULT_FONT_SIZE = 36;
export const DEFAULT_LETTER_SPACING = 0;

export const visualPresets: VisualPreset[] = [
  { value: 'plain-paper', label: 'Plain Paper', background: '#ffffff', color: '#000000', shadowColor: null, sample: 'straylight' },
  { value: 'asahi-paper', label: 'Asahi', background: '#ffffff', color: '#000000', shadowColor: '#ff6868', sample: 'asahi' },
  { value: 'fuyuko-paper', label: 'Fuyuko', background: '#ffffff', color: '#000000', shadowColor: '#7ff28c', sample: 'fuyuko' },
  { value: 'mei-paper', label: 'Mei', background: '#ffffff', color: '#000000', shadowColor: '#ff61b8', sample: 'mei' },
  { value: 'alev1-paper', label: 'ALEV1', background: '#ffffff', color: '#000000', shadowColor: '#44dcff', sample: 'i' },
  { value: 'gold-paper', label: 'Gold', background: '#ffffff', color: '#000000', shadowColor: '#ffc43d', sample: 'human' },
  { value: 'plain-ink', label: 'Plain Ink', background: '#000000', color: '#ffffff', shadowColor: null, sample: 'straylight' },
  { value: 'asahi-night', label: 'Asahi', background: '#000000', color: '#ffffff', shadowColor: '#ff6868', sample: 'asahi' },
  { value: 'fuyuko-night', label: 'Fuyuko', background: '#000000', color: '#ffffff', shadowColor: '#7ff28c', sample: 'fuyuko' },
  { value: 'mei-night', label: 'Mei', background: '#000000', color: '#ffffff', shadowColor: '#ff61b8', sample: 'mei' },
  { value: 'alev1-night', label: 'ALEV1', background: '#000000', color: '#ffffff', shadowColor: '#44dcff', sample: 'i' },
  { value: 'gold-night', label: 'Gold', background: '#000000', color: '#ffffff', shadowColor: '#ffc43d', sample: 'human' },
];

export const defaultVisualPreset = visualPresets[0];

export const binaryToHex = (binary: string): string =>
  Number.parseInt(binary, 2).toString(16).toUpperCase().padStart(2, '0');

const alevCodepointBase = 0xe000;

export const glyphCharForHex = (hex: string): string =>
  String.fromCodePoint(alevCodepointBase + Number.parseInt(hex, 16));

const TOKEN_PREFIX_PATTERN = /(?:^|[\s\[\]])([^\s\[\]]*)$/;
const TOKEN_SUFFIX_PATTERN = /^[^\s\[\]]*/;
const TOKEN_SEPARATOR_PATTERN = /^[\s\[\]:]/;

export const resolveTokenHex = (token: string, keywordMap: KeywordMap): string | null => {
  if (/^0x[0-9a-f]{2}$/i.test(token)) {
    return token.slice(2).toUpperCase();
  }

  if (/^0b[01]{8}$/i.test(token)) {
    return binaryToHex(token.slice(2));
  }

  return keywordMap[token] ?? null;
};

export const normalizeEditorToken = (token: string, keywordMap: KeywordMap): string => {
  const hex = resolveTokenHex(token, keywordMap);
  return hex ? glyphCharForHex(hex) : token;
};

export const normalizeEditorContent = (value: string, keywordMap: KeywordMap): string =>
  String(value ?? '')
    .split(/([\[\]])/)
    .map(fragment => (fragment === '[' || fragment === ']' ? fragment : fragment.replace(/\S+/g, token => normalizeEditorToken(token, keywordMap))))
    .join('');

export const getActiveTokenPrefixFromFragment = (fragment: string): string =>
  fragment.match(TOKEN_PREFIX_PATTERN)?.[1] ?? '';

export const replaceActiveTokenWithSuggestion = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  suggestion: string,
  prefix: string,
  suffixPattern: RegExp,
): { nextValue: string; nextCaret: number } => {
  const after = value.slice(selectionEnd);
  const prefixStart = selectionStart - prefix.length;
  const suffixMatch = after.match(suffixPattern);
  const suffixLength = suffixMatch?.[0]?.length ?? 0;
  const suffix = value.slice(selectionEnd + suffixLength);
  const spacer = suffix.length === 0 || TOKEN_SEPARATOR_PATTERN.test(suffix) ? '' : ' ';

  return {
    nextValue: `${value.slice(0, prefixStart)}${suggestion}${spacer}${suffix}`,
    nextCaret: prefixStart + suggestion.length + spacer.length,
  };
};

export const getKeywordList = (keywordMap: KeywordMap): string[] =>
  Object.keys(keywordMap).sort((left, right) => left.localeCompare(right));

export const getActiveTokenPrefix = (value: string, selectionStart: number): string => {
  const before = value.slice(0, selectionStart);
  return getActiveTokenPrefixFromFragment(before);
};

export const getKeywordSuggestions = (prefix: string, keywordList: string[]): string[] => {
  const normalizedPrefix = prefix.trim().toLowerCase();
  if (!normalizedPrefix || /^0[bx]/i.test(normalizedPrefix)) {
    return [];
  }

  return keywordList.filter(keyword => keyword.startsWith(normalizedPrefix) && keyword !== normalizedPrefix).slice(0, 8);
};

export const applySuggestionToValue = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  suggestion: string,
): { nextValue: string; nextCaret: number } => {
  const prefix = getActiveTokenPrefix(value, selectionStart);
  return replaceActiveTokenWithSuggestion(value, selectionStart, selectionEnd, suggestion, prefix, TOKEN_SUFFIX_PATTERN);
};

export const normalizeHexColor = (value: string): string | null => {
  const normalized = String(value ?? '').trim();
  return /^#[0-9a-f]{6}$/.test(normalized) ? normalized : null;
};

export const buildPreviewShadow = (shadowColor: string | null): string => {
  const normalized = shadowColor ? normalizeHexColor(shadowColor) : null;
  if (!normalized) {
    return 'none';
  }

  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);

  return [
    `drop-shadow(0 0 0.055em rgba(${red}, ${green}, ${blue}, 0.9))`,
    `drop-shadow(0 0 0.18em rgba(${red}, ${green}, ${blue}, 0.45))`,
  ].join(' ');
};

export const canonicalizeEditorContent = (value: string, keywordMap: KeywordMap): CanonicalizeEditorResult => {
  const source = String(value ?? '').replace(/\r\n?/g, '\n');
  let pendingToken = '';
  let canonicalText = '';
  let hasGlyph = false;

  const flushToken = (): CanonicalizeEditorResult | null => {
    if (!pendingToken) {
      return null;
    }

    const resolvedHex = resolveTokenHex(pendingToken, keywordMap);
    if (!resolvedHex) {
      return { ok: false, reason: '未定義のトークンです', token: pendingToken };
    }

    canonicalText += resolvedHex.toLowerCase();
    pendingToken = '';
    hasGlyph = true;
    return null;
  };

  for (const char of source) {
    if (char === '[' || char === ']') {
      const flushResult = flushToken();
      if (flushResult) {
        return flushResult;
      }

      canonicalText += char;
      hasGlyph = true;
      continue;
    }

    if (/\s/.test(char)) {
      const flushResult = flushToken();
      if (flushResult) {
        return flushResult;
      }

      canonicalText += char === '\n' ? '\n' : ' ';
      continue;
    }

    pendingToken += char;
  }

  const flushResult = flushToken();
  if (flushResult) {
    return flushResult;
  }

  if (!hasGlyph) {
    return { ok: false, reason: '出力できる文字がありません' };
  }

  const lines = canonicalText.split('\n');
  if (lines.length > 5) {
    return { ok: false, reason: '行数は5行以内にしてください' };
  }

  if (lines.some(line => line.length > 100)) {
    return { ok: false, reason: '1行は100文字以内にしてください' };
  }

  return { ok: true, text: canonicalText };
};

export const buildSvgDownloadUrl = ({
  text,
  fontSize,
  letterSpacing,
  color,
  shadowColor,
  backgroundColor,
}: {
  text: string;
  fontSize: number;
  letterSpacing: number;
  color: string;
  shadowColor: string | null;
  backgroundColor: string | null;
}): string => {
  const params = new URLSearchParams({
    t: text,
    fs: String(fontSize),
    ls: String(letterSpacing),
    c: color,
  });

  if (shadowColor) {
    params.set('sc', shadowColor);
  }

  if (backgroundColor) {
    params.set('bc', backgroundColor);
  }

  return `/api/svg?${params.toString()}`;
};
