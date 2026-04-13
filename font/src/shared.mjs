import { readdir, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const FONT_DIR = path.resolve(__dirname, '..');
export const REPO_DIR = path.resolve(FONT_DIR, '..');
export const DATA_DIR = path.join(REPO_DIR, 'data');
export const GENERATED_DIR = path.join(FONT_DIR, 'generated');
export const DIST_DIR = path.join(FONT_DIR, 'dist');
export const UFO_DIR = path.join(GENERATED_DIR, 'source.ufo');
export const GLYPHS_DIR = path.join(UFO_DIR, 'glyphs');
export const FEATURES_PATH = path.join(UFO_DIR, 'features.fea');
export const METADATA_PATH = path.join(DIST_DIR, 'manifest.json');
export const PREVIEW_PATH = path.join(DIST_DIR, 'preview.html');
export const SVG_PARTS_PATH = path.join(FONT_DIR, 'alev-base.svg');
export const DONOR_FONT_PATH = path.join(FONT_DIR, 'vendor', 'IBMPlexMono-Regular.ttf');
export const DONOR_LICENSE_PATH = path.join(FONT_DIR, 'vendor', 'IBMPlexMono-OFL.txt');

const PARTS = Object.freeze([
  { name: 'part1', mask: 0x80 },
  { name: 'part2', mask: 0x40 },
  { name: 'part3', mask: 0x20 },
  { name: 'part4', mask: 0x10 },
  { name: 'part5', mask: 0x08 },
  { name: 'part6', mask: 0x04 },
  { name: 'part7', mask: 0x02 },
  { name: 'part8', mask: 0x01 },
]);

export function isMain(importMeta) {
  return Boolean(process.argv[1]) && importMeta.url === pathToFileURL(process.argv[1]).href;
}

export function hexValues() {
  return Array.from({ length: 256 }, (_, index) => index.toString(16).toUpperCase().padStart(2, '0'));
}

export function binaryValues() {
  return Array.from({ length: 256 }, (_, index) => index.toString(2).padStart(8, '0'));
}

export function hexForBinary(binary) {
  return Number.parseInt(binary, 2).toString(16).toUpperCase().padStart(2, '0');
}

export function binaryForHex(hex) {
  return Number.parseInt(hex, 16).toString(2).padStart(8, '0');
}

export function glyphNameForHex(hex) {
  return `g${hex.toUpperCase()}`;
}

export function codepointForHex(hex) {
  return 0xe000 + Number.parseInt(hex, 16);
}

export function codepointLabel(codepoint) {
  return `U+${codepoint.toString(16).toUpperCase().padStart(4, '0')}`;
}

export function glyphFileName(glyphName) {
  return glyphName === '.notdef' ? '_notdef.glif' : `${glyphName}.glif`;
}

export function inputGlyphNameForChar(char) {
  if (char === ' ') {
    return 'space';
  }

  return `u${char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`;
}

export async function ensureDir(directory) {
  await mkdir(directory, { recursive: true });
}

export async function resetDir(directory) {
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
}

export async function writeText(filePath, contents) {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, contents, 'utf8');
}

export async function writeJson(filePath, value) {
  await writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export async function listFiles(directory) {
  await ensureDir(directory);
  return readdir(directory);
}

export async function loadYaml(filePath) {
  const source = await readFile(filePath, 'utf8');
  return YAML.parse(source);
}

export async function loadGlyphModel() {
  const model = await loadYaml(path.join(DATA_DIR, 'glyph-model.yaml'));
  if (!model || typeof model !== 'object') {
    throw new Error('glyph-model.yaml is empty or malformed.');
  }

  return model;
}

export async function loadSvgParts() {
  const source = await readFile(SVG_PARTS_PATH, 'utf8');
  const parts = new Map();

  for (const part of PARTS) {
    const match = source.match(new RegExp(`<path\\b[^>]*id="${part.name}"[^>]*d="([^"]+)"[^>]*/?>`, 's'));
    if (!match) {
      throw new Error(`Missing ${part.name} in ${SVG_PARTS_PATH}`);
    }

    parts.set(part.name, {
      ...part,
      contours: parseSvgPath(match[1]),
    });
  }

  return parts;
}

export async function loadLexicon() {
  const raw = await loadYaml(path.join(DATA_DIR, 'lexicon.yaml'));
  const entries = Array.isArray(raw?.entries) ? raw.entries : [];
  const allEntries = new Map(
    binaryValues().map((binary) => {
      const hex = hexForBinary(binary);
      return [hex, { binary, hex, keywords: [], label: null, description: null, notes: null }];
    }),
  );
  const seenBinary = new Set();
  const seenKeywords = new Map();

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') {
      throw new Error('Each lexicon entry must be an object.');
    }

    const originalBinary = String(entry.binary ?? '');
    const binary = originalBinary.trim();
    if (!/^[01]{8}$/.test(binary)) {
      throw new Error(`Invalid binary code in lexicon: ${originalBinary}`);
    }

    if (seenBinary.has(binary)) {
      throw new Error(`Duplicate lexicon entry for ${binary}`);
    }

    seenBinary.add(binary);
    const hex = hexForBinary(binary);

    const keywords = Array.isArray(entry.keywords) ? entry.keywords : [];
    const normalizedKeywords = keywords.map((keyword) => String(keyword).trim()).filter(Boolean);
    const uniqueKeywords = new Set();

    for (const keyword of normalizedKeywords) {
      if (!/^[a-z0-9]+$/.test(keyword)) {
        throw new Error(`Keyword "${keyword}" for ${binary} must be lowercase ASCII letters and digits only.`);
      }

      if (uniqueKeywords.has(keyword)) {
        throw new Error(`Duplicate keyword "${keyword}" inside lexicon entry ${binary}`);
      }

      if (seenKeywords.has(keyword)) {
        throw new Error(`Keyword "${keyword}" is already assigned to ${seenKeywords.get(keyword)}`);
      }

      uniqueKeywords.add(keyword);
      seenKeywords.set(keyword, binary);
    }

    allEntries.set(hex, {
      binary,
      hex,
      keywords: normalizedKeywords,
      label: entry.label ? String(entry.label) : null,
      description: entry.description ? String(entry.description) : null,
      notes: entry.notes ? String(entry.notes) : null,
    });
  }

  return allEntries;
}

export function collectInputChars(lexicon) {
  const chars = new Set([' ', ':']);

  for (const digit of '0123456789') {
    chars.add(digit);
  }

  for (const uppercase of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    chars.add(uppercase);
  }

  for (const lowercase of 'abcdefghijklmnopqrstuvwxyz') {
    chars.add(lowercase);
  }

  for (const entry of lexicon.values()) {
    for (const keyword of entry.keywords ?? []) {
      for (const char of keyword) {
        chars.add(char);
      }
    }
  }

  return Array.from(chars).sort((left, right) => left.codePointAt(0) - right.codePointAt(0));
}

export function activeComponentsForHex(hex, parts = null) {
  const value = Number.parseInt(hex, 16);
  const source = parts ? [...parts.values()] : PARTS;
  return source.filter((component) => (value & component.mask) !== 0);
}

export function bitArrayForHex(hex) {
  const value = Number.parseInt(hex, 16);
  return PARTS.map((part) => (value & part.mask) !== 0);
}

export function rectContour(x, y, width, height) {
  return [
    { x, y, type: 'line' },
    { x: x, y: y + height, type: 'line' },
    { x: x + width, y: y + height, type: 'line' },
    { x: x + width, y, type: 'line' },
  ];
}

export function glifXml({ glyphName, width, unicodes = [], components = [], contours = [] }) {
  const unicodeLines = unicodes
    .map((codepoint) => `  <unicode hex="${codepoint.toString(16).toUpperCase().padStart(4, '0')}"/>`)
    .join('\n');

  const outlineChildren = [
    ...components.map((component) => `    <component base="${escapeXml(component.base)}"/>`),
    ...contours.flatMap((contour) => [
      '    <contour>',
      ...contour.map((point) => {
        const attrs = [
          `x="${formatNumber(point.x)}"`,
          `y="${formatNumber(point.y)}"`,
          point.type ? `type="${point.type}"` : null,
        ]
          .filter(Boolean)
          .join(' ');
        return `      <point ${attrs}/>`;
      }),
      '    </contour>',
    ]),
  ];

  const outlineLines = outlineChildren.length
    ? [
        '  <outline>',
        ...outlineChildren,
        '  </outline>',
      ].join('\n')
    : '';

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<glyph name="' + escapeXml(glyphName) + '" format="2">',
    `  <advance width="${formatNumber(width)}"/>`,
    unicodeLines,
    outlineLines,
    '</glyph>',
    '',
  ]
    .filter(Boolean)
    .join('\n');
}

export function plistXml(value) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">',
    plistValueXml(value, 0),
    '</plist>',
    '',
  ].join('\n');
}

function plistValueXml(value, depth) {
  const indent = '  '.repeat(depth);
  const childIndent = '  '.repeat(depth + 1);

  if (Array.isArray(value)) {
    const lines = [`${indent}<array>`];
    for (const item of value) {
      lines.push(plistValueXml(item, depth + 1));
    }
    lines.push(`${indent}</array>`);
    return lines.join('\n');
  }

  if (value && typeof value === 'object') {
    const lines = [`${indent}<dict>`];
    for (const [key, item] of Object.entries(value)) {
      lines.push(`${childIndent}<key>${escapeXml(key)}</key>`);
      lines.push(plistValueXml(item, depth + 1));
    }
    lines.push(`${indent}</dict>`);
    return lines.join('\n');
  }

  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? `${indent}<integer>${value}</integer>`
      : `${indent}<real>${value}</real>`;
  }

  if (typeof value === 'boolean') {
    return `${indent}<${value ? 'true' : 'false'}/>`;
  }

  return `${indent}<string>${escapeXml(String(value ?? ''))}</string>`;
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

function parseSvgPath(d) {
  const tokens = d.match(/[MmLlHhVvCcSsZz]|[+-]?(?:\d+\.\d+|\d+\.|\.\d+|\d+)(?:[eE][+-]?\d+)?/g);
  if (!tokens) {
    return [];
  }

  const contours = [];
  let index = 0;
  let command = null;
  let current = { x: 0, y: 0 };
  let start = null;
  let segments = [];
  let previousCurveControl = null;

  const pushContour = (closed) => {
    if (!start || segments.length === 0) {
      segments = [];
      start = null;
      return;
    }

    contours.push(segmentsToContour(start, segments, closed));
    segments = [];
    start = null;
  };

  while (index < tokens.length) {
    if (isCommand(tokens[index])) {
      command = tokens[index];
      index += 1;
    }

    if (!command) {
      throw new Error(`Malformed SVG path: ${d}`);
    }

    switch (command) {
      case 'M':
      case 'm': {
        const point = readPoint(tokens, index, current, command === 'm');
        index += 2;
        if (segments.length > 0) {
          pushContour(false);
        }
        start = point;
        current = point;
        previousCurveControl = null;
        command = command === 'm' ? 'l' : 'L';
        break;
      }
      case 'L':
      case 'l': {
        while (index < tokens.length && !isCommand(tokens[index])) {
          const point = readPoint(tokens, index, current, command === 'l');
          index += 2;
          segments.push({ type: 'line', to: point });
          current = point;
          previousCurveControl = null;
        }
        break;
      }
      case 'H':
      case 'h': {
        while (index < tokens.length && !isCommand(tokens[index])) {
          const value = Number(tokens[index]);
          index += 1;
          const point = {
            x: command === 'h' ? current.x + value : value,
            y: current.y,
          };
          segments.push({ type: 'line', to: point });
          current = point;
          previousCurveControl = null;
        }
        break;
      }
      case 'V':
      case 'v': {
        while (index < tokens.length && !isCommand(tokens[index])) {
          const value = Number(tokens[index]);
          index += 1;
          const point = {
            x: current.x,
            y: command === 'v' ? current.y + value : value,
          };
          segments.push({ type: 'line', to: point });
          current = point;
          previousCurveControl = null;
        }
        break;
      }
      case 'C':
      case 'c': {
        while (index < tokens.length && !isCommand(tokens[index])) {
          const c1 = readPoint(tokens, index, current, command === 'c');
          const c2Base = command === 'c' ? current : { x: 0, y: 0 };
          const c2 = {
            x: Number(tokens[index + 2]) + c2Base.x,
            y: Number(tokens[index + 3]) + c2Base.y,
          };
          const to = {
            x: Number(tokens[index + 4]) + c2Base.x,
            y: Number(tokens[index + 5]) + c2Base.y,
          };
          index += 6;
          segments.push({ type: 'curve', c1, c2, to });
          current = to;
          previousCurveControl = c2;
        }
        break;
      }
      case 'S':
      case 's': {
        while (index < tokens.length && !isCommand(tokens[index])) {
          const c1 = previousCurveControl
            ? {
                x: current.x + (current.x - previousCurveControl.x),
                y: current.y + (current.y - previousCurveControl.y),
              }
            : { ...current };
          const relativeBase = command === 's' ? current : { x: 0, y: 0 };
          const c2 = {
            x: Number(tokens[index]) + relativeBase.x,
            y: Number(tokens[index + 1]) + relativeBase.y,
          };
          const to = {
            x: Number(tokens[index + 2]) + relativeBase.x,
            y: Number(tokens[index + 3]) + relativeBase.y,
          };
          index += 4;
          segments.push({ type: 'curve', c1, c2, to });
          current = to;
          previousCurveControl = c2;
        }
        break;
      }
      case 'Z':
      case 'z': {
        pushContour(true);
        current = start ?? current;
        previousCurveControl = null;
        command = null;
        break;
      }
      default:
        throw new Error(`Unsupported SVG path command: ${command}`);
    }
  }

  if (segments.length > 0) {
    pushContour(false);
  }

  return contours;
}

function readPoint(tokens, index, current, isRelative) {
  const x = Number(tokens[index]);
  const y = Number(tokens[index + 1]);
  return {
    x: isRelative ? current.x + x : x,
    y: isRelative ? current.y + y : y,
  };
}

function segmentsToContour(start, segments, closed) {
  const contour = [];
  let addedStart = false;

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const isClosingToStart = closed && index === segments.length - 1 && samePoint(segment.to, start);

    if (segment.type === 'line') {
      if (!addedStart) {
        contour.push({ x: start.x, y: start.y, type: 'line' });
        addedStart = true;
      }

      if (!isClosingToStart) {
        contour.push({ x: segment.to.x, y: segment.to.y, type: 'line' });
      }
      continue;
    }

    if (!addedStart) {
      contour.push({ x: start.x, y: start.y, type: 'curve' });
      addedStart = true;
    }

    contour.push({ x: segment.c1.x, y: segment.c1.y });
    contour.push({ x: segment.c2.x, y: segment.c2.y });

    if (!isClosingToStart) {
      contour.push({ x: segment.to.x, y: segment.to.y, type: 'curve' });
    }
  }

  return contour;
}

function samePoint(left, right) {
  return Math.abs(left.x - right.x) < 1e-9 && Math.abs(left.y - right.y) < 1e-9;
}

function isCommand(token) {
  return /^[A-Za-z]$/.test(token);
}
