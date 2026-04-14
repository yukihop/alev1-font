import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { cache } from 'react';

import { getKeywordMap } from './alev';
import { tokenizeAlevLine } from './alev-tokens';

export type CorpusEntry = {
  position: string;
  japanese: string | null;
  alevLines: string[] | null;
  comments: string[];
};

export type CorpusSection = {
  title: string | null;
  entries: CorpusEntry[];
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
    entries: [],
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

  const flushBlock = () => {
    if (blockLines.length === 0) {
      return;
    }

    const [positionLine, japaneseLine = '-', ...rest] = blockLines;
    blockLines = [];

    if (!positionLine.startsWith('@')) {
      return;
    }

    const alevLines: string[] = [];
    const comments: string[] = [];
    let commentMode = false;

    for (const rawLine of rest) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) {
        continue;
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

    ensureSection().entries.push({
      position: positionLine.slice(1).trim(),
      japanese,
      alevLines: resolvedAlevLines,
      comments,
    });
  };

  for (const rawLine of source.replace(/\r\n?/g, '\n').split('\n')) {
    const trimmed = rawLine.trim();

    if (trimmed.startsWith('#')) {
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

    const sectionMatch = trimmed.match(sectionPattern) ?? trimmed.match(legacySectionPattern);
    if (sectionMatch) {
      currentSection = createSection(sectionMatch[1].trim());
      sections.push(currentSection);
      continue;
    }

    if (trimmed.startsWith('@')) {
      blockLines = [trimmed];
    }
  }

  flushBlock();

  return {
    sections: sections.filter((section) => section.entries.length > 0),
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
    for (const entry of section.entries) {
      if (entry.alevLines === null) {
        continue;
      }

      for (const line of entry.alevLines) {
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
