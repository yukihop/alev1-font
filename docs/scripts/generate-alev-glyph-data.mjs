import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { DOMParser } from '@xmldom/xmldom';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const docsDir = path.resolve(__dirname, '..');
const repoDir = path.resolve(docsDir, '..');
const parser = new DOMParser();

const glyphModelPath = path.join(repoDir, 'data', 'glyph-model.yaml');
const partsSvgPath = path.join(repoDir, 'data', 'glyphs', 'alevish.svg');
const openBracketSvgPath = path.join(repoDir, 'data', 'glyphs', 'open_bracket.svg');
const closeBracketSvgPath = path.join(repoDir, 'data', 'glyphs', 'close_bracket.svg');
const outputPath = path.join(docsDir, 'lib', 'generated', 'alev-glyph-data.json');

async function main() {
  const glyphModelSource = await readFile(glyphModelPath, 'utf8');
  const glyphModel = YAML.parse(glyphModelSource);

  if (!glyphModel?.font || typeof glyphModel.font !== 'object') {
    throw new Error('glyph-model.yaml must define a font section.');
  }

  const partSvg = await loadSvg(partsSvgPath);
  const openBracketSvg = await loadSvg(openBracketSvgPath);
  const closeBracketSvg = await loadSvg(closeBracketSvgPath);

  const glyphData = {
    unitsPerEm: Number(glyphModel.font.unitsPerEm),
    ascender: Number(glyphModel.font.ascender),
    descender: Number(glyphModel.font.descender),
    advanceWidth: Number(glyphModel.font.advanceWidth),
    spaceWidth: Number(glyphModel.font.spaceWidth),
    parts: Object.fromEntries(
      ['part1', 'part2', 'part3', 'part4', 'part5', 'part6', 'part7', 'part8'].map(name => [
        name,
        {
          width: Number(glyphModel.font.advanceWidth),
          viewBox: partSvg.viewBox,
          elements: extractNamedElements(partSvg.root, name),
        },
      ]),
    ),
    brackets: {
      open: {
        width: openBracketSvg.viewBox.width,
        viewBox: openBracketSvg.viewBox,
        elements: extractSingleElements(openBracketSvg.root, openBracketSvgPath),
      },
      close: {
        width: closeBracketSvg.viewBox.width,
        viewBox: closeBracketSvg.viewBox,
        elements: extractSingleElements(closeBracketSvg.root, closeBracketSvgPath),
      },
    },
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(glyphData, null, 2)}\n`, 'utf8');

  console.log(`generated ${path.relative(docsDir, outputPath)}`);
}

async function loadSvg(filePath) {
  const source = await readFile(filePath, 'utf8');
  const document = parser.parseFromString(source, 'image/svg+xml');
  const root = document.documentElement;

  if (!root || root.tagName !== 'svg') {
    throw new Error(`Invalid SVG root in ${filePath}`);
  }

  return {
    root,
    viewBox: parseViewBox(root.getAttribute('viewBox'), filePath),
  };
}

function parseViewBox(rawViewBox, filePath) {
  const values = String(rawViewBox ?? '')
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(value => Number(value));

  if (values.length !== 4 || values.some(value => Number.isNaN(value))) {
    throw new Error(`Invalid viewBox in ${filePath}`);
  }

  const [minX, minY, width, height] = values;
  return { minX, minY, width, height };
}

function extractNamedElements(root, name) {
  const elements = getRenderableElements(root).filter(element => {
    const id = element.getAttribute('id');
    const dataName = element.getAttribute('data-name');
    return id === name || dataName === name;
  });

  if (elements.length === 0) {
    throw new Error(`Missing ${name} in source SVG.`);
  }

  return elements.map(toSerializableElement);
}

function extractSingleElements(root, filePath) {
  const elements = getRenderableElements(root);
  if (elements.length !== 1) {
    throw new Error(`Expected exactly one renderable element in ${filePath}, received ${elements.length}.`);
  }

  return elements.map(toSerializableElement);
}

function getRenderableElements(root) {
  return Array.from(root.getElementsByTagName('*')).filter(element => {
    const tagName = element.tagName.toLowerCase();
    return tagName === 'path' || tagName === 'polygon';
  });
}

function toSerializableElement(element) {
  const attributes = {};

  for (let index = 0; index < element.attributes.length; index += 1) {
    const attribute = element.attributes.item(index);
    if (!attribute) {
      continue;
    }

    const name = attribute.name;
    if (
      name === 'id' ||
      name === 'data-name' ||
      name === 'style' ||
      name === 'fill' ||
      name === 'stroke' ||
      name === 'width' ||
      name === 'height' ||
      name === 'viewBox' ||
      name.startsWith('xmlns')
    ) {
      continue;
    }

    attributes[name] = attribute.value;
  }

  return {
    tagName: element.tagName.toLowerCase(),
    attributes,
  };
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
