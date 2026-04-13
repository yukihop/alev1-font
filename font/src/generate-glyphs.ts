import path from 'node:path';

import {
  GLYPHS_DIR,
  UFO_DIR,
  activeComponentsForHex,
  codepointForHex,
  collectInputChars,
  ensureDir,
  glifXml,
  glyphFileName,
  glyphNameForHex,
  hexValues,
  inputGlyphNameForChar,
  isMain,
  loadGlyphModel,
  loadLexicon,
  loadSvgParts,
  plistXml,
  rectContour,
  writeText,
} from './shared.ts';

export async function generateGlyphs() {
  const model = await loadGlyphModel();
  const lexicon = await loadLexicon();
  const svgParts = await loadSvgParts(model);
  const glyphOrder = [];
  const contents = {};

  await ensureDir(GLYPHS_DIR);

  const addGlyph = async ({
    glyphName,
    fileName = glyphFileName(glyphName),
    width,
    unicodes = [],
    components = [],
    contours = [],
  }) => {
    glyphOrder.push(glyphName);
    contents[glyphName] = fileName;
    await writeText(
      path.join(GLYPHS_DIR, fileName),
      glifXml({ glyphName, width, unicodes, components, contours }),
    );
  };

  const notdefWidth = model.font.notdefWidth;
  await addGlyph({
    glyphName: '.notdef',
    width: notdefWidth,
    contours: [rectContour(90, 0, notdefWidth - 180, 720), rectContour(190, 100, notdefWidth - 380, 520)],
  });

  await addGlyph({
    glyphName: 'space',
    width: model.font.spaceWidth,
    unicodes: [0x0020],
  });

  for (const char of collectInputChars(lexicon).filter((value) => value !== ' ')) {
    await addGlyph({
      glyphName: inputGlyphNameForChar(char),
      width: model.font.inputGlyphWidth,
      unicodes: [char.codePointAt(0)],
    });
  }

  for (const part of svgParts.values()) {
    await addGlyph({
      glyphName: part.name,
      width: model.font.advanceWidth,
      contours: part.contours,
    });
  }

  for (const hex of hexValues()) {
    await addGlyph({
      glyphName: glyphNameForHex(hex),
      width: model.font.advanceWidth,
      unicodes: [codepointForHex(hex)],
      components: activeComponentsForHex(hex, svgParts).map((part) => ({ base: part.name })),
    });
  }

  await writeText(
    path.join(UFO_DIR, 'metainfo.plist'),
    plistXml({
      creator: 'Alevish build scripts',
      formatVersion: 3,
    }),
  );

  await writeText(
    path.join(UFO_DIR, 'fontinfo.plist'),
    plistXml({
      familyName: model.font.familyName,
      styleName: model.font.styleName,
      openTypeNameDesigner: model.font.designer,
      unitsPerEm: model.font.unitsPerEm,
      ascender: model.font.ascender,
      descender: model.font.descender,
      capHeight: 700,
      xHeight: 500,
      openTypeHheaAscender: model.font.ascender,
      openTypeHheaDescender: model.font.descender,
      openTypeHheaLineGap: 0,
      openTypeOS2TypoAscender: model.font.ascender,
      openTypeOS2TypoDescender: model.font.descender,
      openTypeOS2TypoLineGap: 0,
      openTypeOS2WinAscent: model.font.ascender,
      openTypeOS2WinDescent: Math.abs(model.font.descender),
      versionMajor: 0,
      versionMinor: 1,
    }),
  );

  await writeText(path.join(UFO_DIR, 'layercontents.plist'), plistXml([['public.default', 'glyphs']]));
  await writeText(path.join(UFO_DIR, 'lib.plist'), plistXml({ 'public.glyphOrder': glyphOrder }));
  await writeText(path.join(GLYPHS_DIR, 'contents.plist'), plistXml(contents));

  console.log(`generated ${glyphOrder.length} glyph definitions in ${UFO_DIR}`);
}

if (isMain(import.meta)) {
  generateGlyphs().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
