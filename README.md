# Alevish: ALEV-1 フォント

ALEV-1 フォントビルド＋説明サイトのためのリポジトリです。

## 構成

- `data/`: 共有の正本データ。概念語辞書はここにある `lexicon.yaml`。
- `font/`: フォント生成パッケージ。`UFO` と OpenType feature を中間モデルとして生成し、`TTF` / `WOFF2` を出力。
- `docs/`: 11ty ベースのドキュメントサイト。

## 前提ツール

- Node.js
- `pnpm`
- `uv` (for font building only)

## セットアップ

```bash
pnpm install
cd font
uv sync
```

## フォントをビルドする

リポジトリルートで次を実行します。

```bash
pnpm --filter font build
```

主な出力先:

- `font/dist/alev1.ttf`
- `font/dist/alev1.woff2`
- `font/dist/manifest.json`
- `font/dist/preview.html`

設定と辞書の編集対象:

- `data/glyph-model.yaml`
- `data/lexicon.yaml`

## デモサイトを起動する

開発サーバー:

```bash
pnpm --filter site dev
```

本番ビルド:

```bash
pnpm --filter site build
```

## ドキュメントサイトを起動する

docs は 11ty ベースです。先にフォントをビルドして `font/dist/` を用意してから起動します。

```bash
pnpm --filter font build
pnpm --filter docs dev
```

本番ビルド:

```bash
pnpm --filter docs build
```

## 合字（リガチャ）入力ルール

- 概念語は `:love:` のように前後を `:` で囲む。概念語本体は原則小文字。
- 16進指定は `0xFF` のように `0x` + 大文字 2 桁
- 2進指定は `0b11111111` のように `0b` + 8 桁
- 概念語辞書は `data/lexicon.yaml` を共有正本として管理。
