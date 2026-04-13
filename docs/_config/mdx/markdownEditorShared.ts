import { type KeywordMap } from "./simpleEditorShared.ts";

export type MarkdownEditorProps = {
  defaultValue?: string;
  keywordMap: KeywordMap;
};

export type MarkdownEditorServerProps = Omit<MarkdownEditorProps, "keywordMap">;

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
