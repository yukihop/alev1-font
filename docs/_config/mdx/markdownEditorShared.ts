import { type KeywordMap } from "./simpleEditorShared.ts";

export type MarkdownEditorProps = {
  defaultValue?: string;
  keywordMap: KeywordMap;
};

export type MarkdownEditorServerProps = Omit<MarkdownEditorProps, "keywordMap">;

/**
 * `:keyword` 形式のプレフィックスを抽出する。
 * 例: "hello :str" でキャレットが末尾なら "str" を返す。
 */
export function getMarkdownTokenPrefix(
  value: string,
  selectionStart: number,
): string {
  const before = value.slice(0, selectionStart);
  const match = before.match(/:([^:\s]*)$/);
  return match?.[1] ?? "";
}

/**
 * `:prefix` を `:suggestion:` に置換した新しい値とキャレット位置を返す。
 */
export function applyMarkdownSuggestion(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  suggestion: string,
): { nextValue: string; nextCaret: number } {
  const before = value.slice(0, selectionStart);
  const colonPos = before.lastIndexOf(":");
  if (colonPos === -1) {
    return { nextValue: value, nextCaret: selectionStart };
  }
  // キャレット以降に残っている未確定のトークン文字を読み飛ばす
  const after = value.slice(selectionEnd);
  const suffixMatch = after.match(/^[^:\s]*/);
  const skipLength = suffixMatch?.[0]?.length ?? 0;
  // すでに閉じコロンがある場合はそれも含めて置き換える
  const hasClosingColon = value[selectionEnd + skipLength] === ":";
  const insertion = `:${suggestion}:`;
  const nextValue =
    value.slice(0, colonPos) +
    insertion +
    value.slice(selectionEnd + skipLength + (hasClosingColon ? 1 : 0));
  const nextCaret = colonPos + insertion.length;
  return { nextValue, nextCaret };
}

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
