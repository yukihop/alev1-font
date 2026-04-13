import {
  FEATURES_PATH,
  glyphNameForHex,
  inputGlyphNameForChar,
  isMain,
  loadLexicon,
  writeText,
} from './shared.mjs';

export async function generateFeatures() {
  const lexicon = await loadLexicon();
  const conceptEntries = [];
  const valueRules = [];

  for (const entry of lexicon.values()) {
    for (const keyword of entry.keywords) {
      conceptEntries.push({ keyword, hex: entry.hex });
    }
  }

  conceptEntries.sort((left, right) => {
    if (left.keyword.length !== right.keyword.length) {
      return right.keyword.length - left.keyword.length;
    }

    return left.keyword.localeCompare(right.keyword);
  });

  const conceptRules = conceptEntries.map(
    ({ keyword, hex }) =>
      `  sub ${[':', ...keyword, ':'].map(inputGlyphNameForChar).join(' ')} by ${glyphNameForHex(hex)};`,
  );

  for (const entry of lexicon.values()) {
    const hexSequence = ['0', 'x', ...entry.hex].map(inputGlyphNameForChar).join(' ');
    const binarySequence = ['0', 'b', ...entry.binary].map(inputGlyphNameForChar).join(' ');
    valueRules.push(`  sub ${hexSequence} by ${glyphNameForHex(entry.hex)};`);
    valueRules.push(`  sub ${binarySequence} by ${glyphNameForHex(entry.hex)};`);
  }

  const contents = [
    'languagesystem DFLT dflt;',
    '',
    'feature liga {',
    '  # delimited concept keywords',
    ...conceptRules,
    '',
    '  # numeric literals',
    ...valueRules,
    '} liga;',
    '',
  ].join('\n');

  await writeText(FEATURES_PATH, contents);
  console.log(`generated ${conceptRules.length + valueRules.length} GSUB ligature rule(s)`);
}

if (isMain(import.meta)) {
  generateFeatures().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
