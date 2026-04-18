import { access } from 'node:fs/promises';

import {
  binaryValues,
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

  if (svgParts.size !== 8) {
    throw new Error(`Expected 8 SVG parts, received ${svgParts.size}.`);
  }

  if (bracketGlyphs.length !== 2) {
    throw new Error(`Expected 2 bracket glyphs, received ${bracketGlyphs.length}.`);
  }

  await access(DONOR_FONT_PATH);
  await access(DONOR_LICENSE_PATH);

  for (const binary of lexicon.keys()) {
    if (!/^[01]{8}$/.test(binary)) {
      throw new Error(`Lexicon key must be an 8-bit binary string, received ${binary}.`);
    }
  }

  const glyphSlotCount = binaryValues().length;
  const keywordCount = [...lexicon.values()].reduce((count, entry) => count + entry.keywords.length, 0);
  console.log(`check passed: ${glyphSlotCount} glyph slots, ${keywordCount} keyword(s), 8 SVG parts, 2 bracket glyphs, donor font present`);
}

if (isMain(import.meta)) {
  runCheck().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
