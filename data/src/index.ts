import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type LexiconGlyphRecord = {
  binary: string;
  keywords: string[];
  comment: string | null;
};

export type CorpusEntry = {
  type: 'entry';
  position: string;
  anchor: string | null;
  japanese: string | null;
  alevLines: string[] | null;
  comments: string[];
};

export type CorpusParagraph = {
  type: 'paragraph';
  text: string;
};

export type CorpusSectionItem = CorpusEntry | CorpusParagraph;

export type CorpusSection = {
  title: string | null;
  items: CorpusSectionItem[];
};

export type CorpusDocument = {
  sections: CorpusSection[];
};

const PACKAGE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LEXICON_PATH = path.join(PACKAGE_DIR, 'lexicon.txt');
const CORPUS_PATH = path.join(PACKAGE_DIR, 'corpus.txt');

const sectionPattern = /^\[\[(.+)\]\]\s*$/;
const legacySectionPattern = /^\[(.+)\]\s*$/;

function readRequiredText(filePath: string): string {
  if (!existsSync(filePath)) {
    throw new Error(`Missing required source file: ${filePath}`);
  }

  return readFileSync(filePath, 'utf8');
}

function createSection(title: string | null): CorpusSection {
  return {
    title,
    items: [],
  };
}

function binaryToHex(binary: string): string {
  return Number.parseInt(binary, 2)
    .toString(16)
    .toUpperCase()
    .padStart(2, '0');
}

export function parseLexiconSource(
  source: string,
): Map<string, LexiconGlyphRecord> {
  const lexicon = new Map<string, LexiconGlyphRecord>();
  const seenBinaries = new Set<string>();
  const seenKeywords = new Map<string, string>();
  const lines = String(source ?? '').replace(/\r\n?/g, '\n').split('\n');
  let current:
    | {
        header: string;
        keywords: string | null;
        commentLines: string[];
      }
    | null = null;

  const flushCurrent = () => {
    if (!current) {
      return;
    }

    const rawBinary = current.header.slice(1).trim();
    if (!/^[01]{8}$/.test(rawBinary)) {
      throw new Error(`Invalid lexicon binary code: ${current.header}`);
    }

    if (seenBinaries.has(rawBinary)) {
      throw new Error(`Duplicate lexicon entry for ${rawBinary}`);
    }

    if (current.keywords === null) {
      throw new Error(`Missing keyword line for lexicon entry ${rawBinary}`);
    }

    seenBinaries.add(rawBinary);
    const normalizedKeywords =
      current.keywords === '-'
        ? []
        : current.keywords
            .split(',')
            .map((keyword) => keyword.trim())
            .filter(Boolean);
    const uniqueKeywords = new Set<string>();

    for (const keyword of normalizedKeywords) {
      if (keyword === '-') {
        throw new Error(
          `Keyword "-" for ${rawBinary} is reserved as the no-keyword marker.`,
        );
      }

      if (!/^[a-z0-9-]+$/.test(keyword)) {
        throw new Error(
          `Keyword "${keyword}" for ${rawBinary} must use lowercase ASCII letters, digits, and hyphen only.`,
        );
      }

      if (uniqueKeywords.has(keyword)) {
        throw new Error(
          `Duplicate keyword "${keyword}" inside lexicon entry ${rawBinary}`,
        );
      }

      if (seenKeywords.has(keyword)) {
        throw new Error(
          `Keyword "${keyword}" is already assigned to ${seenKeywords.get(
            keyword,
          )}; duplicate in ${rawBinary}`,
        );
      }

      uniqueKeywords.add(keyword);
      seenKeywords.set(keyword, rawBinary);
    }

    const comment = current.commentLines.join('\n').trim() || null;
    lexicon.set(rawBinary, {
      binary: rawBinary,
      keywords: normalizedKeywords,
      comment,
    });
    current = null;
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (trimmed.startsWith('//')) {
      continue;
    }

    if (trimmed.startsWith('@')) {
      flushCurrent();
      current = {
        header: trimmed,
        keywords: null,
        commentLines: [],
      };
      continue;
    }

    if (!current) {
      if (!trimmed) {
        continue;
      }

      throw new Error(
        `Lexicon content must start with an @binary entry, received "${trimmed}"`,
      );
    }

    if (current.keywords === null) {
      if (!trimmed) {
        throw new Error(
          `Missing keyword marker for lexicon entry ${current.header.slice(1).trim()}; use "-" when no keywords are assigned.`,
        );
      }

      current.keywords = trimmed;
      continue;
    }

    if (!trimmed) {
      flushCurrent();
      continue;
    }

    current.commentLines.push(rawLine.trimEnd());
  }

  flushCurrent();

  return lexicon;
}

export function parseCorpusSource(source: string): CorpusDocument {
  const sections: CorpusSection[] = [];
  let currentSection: CorpusSection | null = null;
  let blockLines: string[] = [];

  const ensureSection = () => {
    if (currentSection) {
      return currentSection;
    }

    currentSection = createSection(null);
    sections.push(currentSection);
    return currentSection;
  };

  const isSectionLine = (line: string) =>
    line.match(sectionPattern) ?? line.match(legacySectionPattern);

  const flushBlock = () => {
    if (blockLines.length === 0) {
      return;
    }

    const lines = blockLines;
    blockLines = [];
    const [positionLine, ...bodyLines] = lines;
    const trimmedPositionLine = positionLine.trim();

    if (!trimmedPositionLine.startsWith('@')) {
      if (trimmedPositionLine.startsWith('#')) {
        throw new Error(
          `Anchor line must appear immediately after an @ line: ${trimmedPositionLine}`,
        );
      }

      if (bodyLines.length === 0 && !isSectionLine(trimmedPositionLine)) {
        ensureSection().items.push({
          type: 'paragraph',
          text: positionLine,
        });
      }
      return;
    }

    let bodyIndex = 0;
    let anchor: string | null = null;
    const anchorLine = bodyLines[bodyIndex]?.trim();
    if (anchorLine?.startsWith('#')) {
      anchor = anchorLine.slice(1).trim();
      if (!anchor) {
        throw new Error(
          `Anchor id must not be empty for entry: ${trimmedPositionLine}`,
        );
      }
      bodyIndex += 1;
    }

    while (bodyLines[bodyIndex]?.trim().startsWith('//')) {
      bodyIndex += 1;
    }

    const japaneseLine = bodyLines[bodyIndex] ?? '-';
    const rest = bodyLines.slice(bodyIndex + 1);
    const alevLines: string[] = [];
    const comments: string[] = [];
    let commentMode = false;

    for (const rawLine of rest) {
      const line = rawLine.trim();
      if (!line || line.startsWith('//')) {
        continue;
      }

      if (line.startsWith('#')) {
        throw new Error(
          `Anchor line must appear immediately after an @ line: ${line}`,
        );
      }

      if (line.startsWith('!')) {
        commentMode = true;
        const comment = line.slice(1).trim();
        if (comment) {
          comments.push(comment);
        }
        continue;
      }

      if (commentMode) {
        comments.push(line);
        continue;
      }

      alevLines.push(line);
    }

    const japaneseValue = japaneseLine.trim();
    const japanese = japaneseValue === '-' ? null : japaneseValue;
    const normalizedAlevLines = alevLines.filter((line) => line.length > 0);
    const resolvedAlevLines =
      normalizedAlevLines.length === 1 && normalizedAlevLines[0] === '-'
        ? null
        : normalizedAlevLines;

    ensureSection().items.push({
      type: 'entry',
      position: trimmedPositionLine.slice(1).trim(),
      anchor,
      japanese,
      alevLines: resolvedAlevLines,
      comments,
    });
  };

  for (const rawLine of source.replace(/\r\n?/g, '\n').split('\n')) {
    const trimmed = rawLine.trim();

    if (trimmed.startsWith('//')) {
      continue;
    }

    if (!trimmed) {
      flushBlock();
      continue;
    }

    if (blockLines.length > 0) {
      blockLines.push(rawLine);
      continue;
    }

    const sectionMatch = isSectionLine(trimmed);
    if (sectionMatch) {
      currentSection = createSection(sectionMatch[1].trim());
      sections.push(currentSection);
      continue;
    }

    blockLines = [rawLine];
  }

  flushBlock();

  return {
    sections: sections.filter((section) => section.items.length > 0),
  };
}

export function loadLexiconData(): Map<string, LexiconGlyphRecord> {
  return parseLexiconSource(readRequiredText(LEXICON_PATH));
}

export function loadCorpusDocument(): CorpusDocument {
  return parseCorpusSource(readRequiredText(CORPUS_PATH));
}
