import {
  getActiveTokenPrefixFromFragment,
  replaceActiveTokenWithSuggestion,
} from './editor-utils';

export type MarkdownEditorProps = {
  defaultValue?: string;
};

export const getMarkdownTokenPrefix = (value: string, selectionStart: number): string => {
  const before = value.slice(0, selectionStart);
  const colonPos = before.lastIndexOf(':');
  if (colonPos === -1) {
    return '';
  }

  const fragment = before.slice(colonPos + 1);
  if (/[\r\n]/.test(fragment)) {
    return '';
  }

  return getActiveTokenPrefixFromFragment(fragment);
};

export const applyMarkdownSuggestion = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  suggestion: string,
): { nextValue: string; nextCaret: number } => {
  const before = value.slice(0, selectionStart);
  const colonPos = before.lastIndexOf(':');
  if (colonPos === -1) {
    return { nextValue: value, nextCaret: selectionStart };
  }

  const fragment = value.slice(colonPos + 1, selectionStart);
  if (/[\r\n]/.test(fragment)) {
    return { nextValue: value, nextCaret: selectionStart };
  }

  const prefix = getActiveTokenPrefixFromFragment(fragment);
  return replaceActiveTokenWithSuggestion(value, selectionStart, selectionEnd, suggestion, prefix, /^[^\s:\[\]]*/);
};

export const DEFAULT_MARKDOWN_VALUE = `# ALEV-1メモパッド

日本語と英語にALEV文字を混在させた文章を編集できます :love:

- シンボル: :i: :love: :straylight:
- 16進入力: :0xCC:
- 2進入力: :0b11110010:

## テーブル

| Name            | Symbol           |
| --------------- | ---------------- |
| Live Live Live! | :live live live: |
`;
