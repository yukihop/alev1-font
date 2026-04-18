import {
  FEATURES_PATH,
  glyphNameForHex,
  hexForBinary,
  inputGlyphNameForChar,
  isMain,
  loadLexicon,
  writeText,
} from './shared.ts';

export async function generateFeatures() {
  const lexicon = await loadLexicon();
  const conceptEntries = [];
  const valueRules = [];

  for (const entry of lexicon.values()) {
    for (const keyword of entry.keywords) {
      conceptEntries.push({ keyword, hex: hexForBinary(entry.binary) });
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
    const hex = hexForBinary(entry.binary);
    const binarySequence = ['0', 'b', ...entry.binary].map(inputGlyphNameForChar).join(' ');
    valueRules.push(`  sub ${['0', 'x', ...hex].map(inputGlyphNameForChar).join(' ')} by ${glyphNameForHex(hex)};`);
    valueRules.push(`  sub ${binarySequence} by ${glyphNameForHex(hex)};`);
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
