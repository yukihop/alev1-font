import {
  DIST_DIR,
  bitArrayForHex,
  binaryForHex,
  codepointForHex,
  codepointLabel,
  ensureDir,
  glyphNameForHex,
  hexValues,
  isMain,
  loadGlyphModel,
  writeJson,
} from './shared.ts';

export async function buildMetadata() {
  const model = await loadGlyphModel();
  await ensureDir(DIST_DIR);

  const glyphs = hexValues().map((hex) => {
    const codepoint = codepointForHex(hex);
    return {
      binary: binaryForHex(hex),
      hex,
      glyphName: glyphNameForHex(hex),
      codepoint: codepointLabel(codepoint),
      char: String.fromCodePoint(codepoint),
      bits: bitArrayForHex(hex),
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
