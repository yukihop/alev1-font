# ALEV-1言語解析 & ALEV文字フォント

ALEV-1フォント本体のビルドと、Next.jsベースの静的ドキュメントサイトを管理するリポジトリです。

## 構成

3つのワークスペースパッケージで構成される。

- `data/`: 共有の正本データとパーサー。`lexicon.txt` は概念語辞書。`corpus.txt` はコーパスデータ。`glyphs` はフォントグリフの元となるSVGファイル。
- `font/`: フォント生成パッケージ。`UFO` と OpenType featureを中間モデルとして生成し、`TTF` / `WOFF2` を出力。
- `docs/`: Next.js App Router + MDXベースの静的ドキュメントサイト。
- `functions`: Cloudflare Pages Function用のSVG生成API。

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

- `font/dist/alevish.ttf`
- `font/dist/alevish.woff2`
- `font/dist/manifest.json`
- `font/dist/preview.html`

設定と辞書の編集対象:

- `data/glyph-model.yaml`
- `data/lexicon.txt`

## デモサイトを起動する

開発サーバー:

```bash
pnpm --filter font build
pnpm --filter docs dev
```

本番ビルド:

```bash
pnpm --filter font build
pnpm --filter docs build
```
