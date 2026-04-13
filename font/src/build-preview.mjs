import { readFile } from 'node:fs/promises';

import { METADATA_PATH, PREVIEW_PATH, isMain, loadGlyphModel, writeText } from './shared.mjs';

export async function buildPreview() {
  const model = await loadGlyphModel();
  const manifest = JSON.parse(await readFile(METADATA_PATH, 'utf8'));
  const cards = manifest.glyphs
    .map((glyph) => {
      const keywords = glyph.keywords.length ? glyph.keywords.join(', ') : '&nbsp;';
      return `
        <article class="card">
          <div class="binary">0b${glyph.binary}</div>
          <div class="hex">${glyph.hex}</div>
          <div class="glyph">${glyph.char}</div>
          <div class="codepoint">${glyph.codepoint}</div>
          <div class="keywords">${keywords}</div>
        </article>
      `;
    })
    .join('');

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${model.font.familyName} Preview</title>
    <style>
      @font-face {
        font-family: "${model.font.familyName}";
        src: url("./${model.font.outputFileBase}.woff2") format("woff2");
      }

      :root {
        color-scheme: light;
        font-family: "Iosevka", "IBM Plex Sans", sans-serif;
        background: #f7f2e8;
        color: #16120f;
      }

      body {
        margin: 0;
        padding: 32px;
        background:
          radial-gradient(circle at top left, rgba(205, 153, 84, 0.24), transparent 34%),
          linear-gradient(180deg, #fcf7ef 0%, #f0e5d2 100%);
      }

      h1 {
        margin: 0 0 12px;
        font-size: 2rem;
      }

      p {
        margin: 0 0 24px;
        max-width: 72ch;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
      }

      .card {
        padding: 14px;
        border: 1px solid rgba(22, 18, 15, 0.16);
        border-radius: 16px;
        background: rgba(255, 252, 246, 0.88);
        backdrop-filter: blur(6px);
      }

      .binary,
      .hex,
      .codepoint,
      .meta,
      .keywords {
        font-size: 0.8rem;
      }

      .binary,
      .hex {
        font-weight: 700;
        letter-spacing: 0.08em;
      }

      .glyph {
        margin: 10px 0;
        font-family: "${model.font.familyName}", sans-serif;
        font-size: 3rem;
        line-height: 1;
      }

      .keywords {
        margin-top: 8px;
        min-height: 1lh;
      }
    </style>
  </head>
  <body>
    <h1>${model.font.familyName}</h1>
    <p>
      This preview shows all 256 generated glyphs. Use <code>:word:</code>-style concept tokens,
      <code>0xFF</code>-style hex tokens, and <code>0b11111111</code>-style binary tokens to trigger ligatures.
    </p>
    <section class="grid">${cards}</section>
  </body>
</html>
`;

  await writeText(PREVIEW_PATH, html);
  console.log(`wrote preview to ${PREVIEW_PATH}`);
}

if (isMain(import.meta)) {
  buildPreview().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
