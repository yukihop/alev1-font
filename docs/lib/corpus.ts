import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { cache } from 'react';

import { getKeywordMap } from './alev';
import { tokenizeAlevLine } from './alev-tokens';

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

function resolveRepoDir(): string {
  const candidates = [process.cwd(), path.resolve(process.cwd(), '..')];

  for (const candidate of candidates) {
    const corpusDataPath = path.join(candidate, 'data', 'corpus.txt');
    if (existsSync(corpusDataPath)) {
      return candidate;
    }
  }

  throw new Error('Could not resolve repository root for docs/lib/corpus.ts');
}

const repoDir = resolveRepoDir();
const corpusPath = path.join(repoDir, 'data', 'corpus.txt');

const sectionPattern = /^\[\[(.+)\]\]\s*$/;
const legacySectionPattern = /^\[(.+)\]\s*$/;

function createSection(title: string | null): CorpusSection {
  return {
    title,
    items: [],
  };
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
        throw new Error(`Anchor line must appear immediately after an @ line: ${trimmedPositionLine}`);
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
        throw new Error(`Anchor id must not be empty for entry: ${trimmedPositionLine}`);
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
        throw new Error(`Anchor line must appear immediately after an @ line: ${line}`);
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
      normalizedAlevLines.length === 1 && normalizedAlevLines[0] === '-' ? null : normalizedAlevLines;

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

export const loadCorpusDocument = cache((): CorpusDocument => {
  const source = readFileSync(corpusPath, 'utf8');
  return parseCorpusSource(source);
});

export const getCorpusUsageCounts = cache((): Record<string, number> => {
  const document = loadCorpusDocument();
  const usageCounts: Record<string, number> = {};
  const keywordMap = getKeywordMap();

  for (const section of document.sections) {
    for (const item of section.items) {
      if (item.type !== 'entry' || item.alevLines === null) {
        continue;
      }

      for (const line of item.alevLines) {
        for (const fragment of tokenizeAlevLine(line, keywordMap)) {
          if (fragment.type !== 'token' || !fragment.resolvedHex) {
            continue;
          }

          usageCounts[fragment.resolvedHex] = (usageCounts[fragment.resolvedHex] ?? 0) + 1;
        }
      }
    }
  }

  return usageCounts;
});
