import {
  DIST_DIR,
  bitArrayForHex,
  codepointForHex,
  codepointLabel,
  ensureDir,
  glyphNameForHex,
  hexValues,
  isMain,
  loadGlyphModel,
  loadLexicon,
  writeJson,
} from './shared.ts';

export async function buildMetadata() {
  const model = await loadGlyphModel();
  const lexicon = await loadLexicon();
  await ensureDir(DIST_DIR);

  const glyphs = hexValues().map((hex) => {
    const entry = lexicon.get(hex);
    const codepoint = codepointForHex(hex);
    return {
      binary: entry.binary,
      hex,
      glyphName: glyphNameForHex(hex),
      codepoint: codepointLabel(codepoint),
      char: String.fromCodePoint(codepoint),
      bits: bitArrayForHex(hex),
      keywords: entry.keywords,
      label: entry.label,
      description: entry.description,
      notes: entry.notes,
      comment: entry.comment,
    };
  });

  await writeJson(`${DIST_DIR}/manifest.json`, {
    familyName: model.font.familyName,
    styleName: model.font.styleName,
    outputFileBase: model.font.outputFileBase,
    glyphCount: glyphs.length,
    glyphs,
  });

  console.log(`wrote manifest for ${glyphs.length} glyphs`);
}

if (isMain(import.meta)) {
  buildMetadata().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
