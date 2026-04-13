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
  shadow: string;
  sample: string;
};

export const DEFAULT_EDITOR_VALUE = 'i love straylight 0xFF';
export const DEFAULT_FONT_SIZE = 96;
export const DEFAULT_LETTER_SPACING = 0;

export const visualPresets: VisualPreset[] = [
  { value: 'plain-paper', label: 'Plain Paper', background: '#ffffff', color: '#000000', shadow: 'none', sample: 'straylight' },
  { value: 'asahi-paper', label: 'Asahi', background: '#ffffff', color: '#000000', shadow: 'drop-shadow(0 0 0.08em rgba(255, 104, 104, 0.95)) drop-shadow(0 0 0.24em rgba(255, 104, 104, 0.62))', sample: 'asahi' },
  { value: 'fuyuko-paper', label: 'Fuyuko', background: '#ffffff', color: '#000000', shadow: 'drop-shadow(0 0 0.08em rgba(127, 242, 140, 0.95)) drop-shadow(0 0 0.24em rgba(127, 242, 140, 0.62))', sample: 'fuyuko' },
  { value: 'mei-paper', label: 'Mei', background: '#ffffff', color: '#000000', shadow: 'drop-shadow(0 0 0.08em rgba(255, 97, 184, 0.95)) drop-shadow(0 0 0.24em rgba(255, 97, 184, 0.62))', sample: 'mei' },
  { value: 'alev1-paper', label: 'ALEV1', background: '#ffffff', color: '#000000', shadow: 'drop-shadow(0 0 0.055em rgba(68, 220, 255, 0.9)) drop-shadow(0 0 0.18em rgba(68, 220, 255, 0.45))', sample: 'i' },
  { value: 'gold-paper', label: 'Gold', background: '#ffffff', color: '#000000', shadow: 'drop-shadow(0 0 0.055em rgba(255, 196, 61, 0.9)) drop-shadow(0 0 0.18em rgba(255, 196, 61, 0.45))', sample: 'human' },
  { value: 'plain-ink', label: 'Plain Ink', background: '#000000', color: '#ffffff', shadow: 'none', sample: 'straylight' },
  { value: 'asahi-night', label: 'Asahi', background: '#000000', color: '#ffffff', shadow: 'drop-shadow(0 0 0.08em rgba(255, 104, 104, 0.95)) drop-shadow(0 0 0.24em rgba(255, 104, 104, 0.62))', sample: 'asahi' },
  { value: 'fuyuko-night', label: 'Fuyuko', background: '#000000', color: '#ffffff', shadow: 'drop-shadow(0 0 0.08em rgba(127, 242, 140, 0.95)) drop-shadow(0 0 0.24em rgba(127, 242, 140, 0.62))', sample: 'fuyuko' },
  { value: 'mei-night', label: 'Mei', background: '#000000', color: '#ffffff', shadow: 'drop-shadow(0 0 0.08em rgba(255, 97, 184, 0.95)) drop-shadow(0 0 0.24em rgba(255, 97, 184, 0.62))', sample: 'mei' },
  { value: 'alev1-night', label: 'ALEV1', background: '#000000', color: '#ffffff', shadow: 'drop-shadow(0 0 0.055em rgba(68, 220, 255, 0.9)) drop-shadow(0 0 0.18em rgba(68, 220, 255, 0.45))', sample: 'i' },
  { value: 'gold-night', label: 'Gold', background: '#000000', color: '#ffffff', shadow: 'drop-shadow(0 0 0.055em rgba(255, 196, 61, 0.9)) drop-shadow(0 0 0.18em rgba(255, 196, 61, 0.45))', sample: 'human' },
];

export const defaultVisualPreset = visualPresets[0];

export const binaryToHex = (binary: string): string =>
  Number.parseInt(binary, 2).toString(16).toUpperCase().padStart(2, '0');

export const normalizeEditorToken = (token: string, keywordMap: KeywordMap): string => {
  if (/^0x[0-9a-f]{2}$/i.test(token)) {
    return `0x${token.slice(2).toUpperCase()}`;
  }

  if (/^0b[01]{8}$/i.test(token)) {
    return `0x${binaryToHex(token.slice(2))}`;
  }

  return keywordMap[token] ? `0x${keywordMap[token]}` : token;
};

export const normalizeEditorContent = (value: string, keywordMap: KeywordMap): string =>
  String(value ?? '').replace(/\S+/g, token => normalizeEditorToken(token, keywordMap));

export const getKeywordList = (keywordMap: KeywordMap): string[] =>
  Object.keys(keywordMap).sort((left, right) => left.localeCompare(right));

export const getActiveTokenPrefix = (value: string, selectionStart: number): string => {
  const before = value.slice(0, selectionStart);
  const tokenMatch = before.match(/(?:^|\s)([^\s]*)$/);
  return tokenMatch?.[1] ?? '';
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
  const after = value.slice(selectionEnd);
  const prefix = getActiveTokenPrefix(value, selectionStart);
  const prefixStart = selectionStart - prefix.length;
  const suffixMatch = after.match(/^[^\s]*/);
  const suffixLength = suffixMatch?.[0]?.length ?? 0;
  const suffix = value.slice(selectionEnd + suffixLength);
  const spacer = suffix.startsWith(' ') || suffix.length === 0 ? '' : ' ';

  return {
    nextValue: `${value.slice(0, prefixStart)}${suggestion}${spacer}${suffix}`,
    nextCaret: prefixStart + suggestion.length + spacer.length,
  };
};
