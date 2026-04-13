# font

`font/` is the build package for the concept font. Shared source data lives in `../data`.

## Prerequisites

- Node.js
- `pnpm`
- `uv`

## Setup

```bash
pnpm install
cd font
uv sync
```

## Build

```bash
pnpm --filter font build
```

If `uv` is not on `PATH`, you can point the build at a specific binary:

```bash
UV_BIN=/path/to/uv pnpm --filter font build
```

The build reads `../data/glyph-model.yaml` and `../data/lexicon.yaml`, then writes:

- `font/dist/alev1-poc.ttf`
- `font/dist/alev1-poc.woff2`
- `font/dist/manifest.json`
- `font/dist/preview.html`
