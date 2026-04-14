import { access } from 'node:fs/promises';

import {
  DONOR_FONT_PATH,
  DONOR_LICENSE_PATH,
  isMain,
  loadBracketGlyphs,
  loadGlyphModel,
  loadLexicon,
  loadSvgParts,
} from './shared.ts';

export async function runCheck() {
  const model = await loadGlyphModel();
  const lexicon = await loadLexicon();
  const svgParts = await loadSvgParts(model);
  const bracketGlyphs = await loadBracketGlyphs(model);

  if (!model.font || typeof model.font !== 'object') {
    throw new Error('glyph-model.yaml must define a font section.');
  }

  if (lexicon.size !== 256) {
    throw new Error(`Lexicon normalization failed. Expected 256 entries, received ${lexicon.size}.`);
  }

  if (svgParts.size !== 8) {
    throw new Error(`Expected 8 SVG parts, received ${svgParts.size}.`);
  }

  if (bracketGlyphs.length !== 2) {
    throw new Error(`Expected 2 bracket glyphs, received ${bracketGlyphs.length}.`);
  }

  await access(DONOR_FONT_PATH);
  await access(DONOR_LICENSE_PATH);

  const keywordCount = [...lexicon.values()].reduce((count, entry) => count + entry.keywords.length, 0);
  console.log(`check passed: 256 glyph slots, ${keywordCount} keyword(s), 8 SVG parts, 2 bracket glyphs, donor font present`);
}

if (isMain(import.meta)) {
  runCheck().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
