import {
  loadCorpus,
  loadKeywordMap,
  loadLexicon,
  loadUsageCounts,
} from '@/lib/alev';

import type {
  CorpusRenderableItem,
  CorpusRenderableSection,
} from './CorpusViewClient';
import InlineMdx from './InlineMdx';
import { buildRenderableLine } from './alev-renderable';
import { createRenderableGlyphMap, type RenderableGlyphMap } from './glyph-record';

function lineContainsBinary(
  line: ReturnType<typeof buildRenderableLine>,
  binary: string,
): boolean {
  return line.some(
    (fragment) => fragment.type === 'glyph' && fragment.binary === binary,
  );
}

export type CorpusRenderableData = {
  sections: CorpusRenderableSection[];
  glyphByBinary: RenderableGlyphMap;
};

export const buildCorpusRenderableSections = (
  filterBinary?: string,
  options?: {
    hashLinkBase?: string;
  },
): CorpusRenderableData => {
  const corpus = loadCorpus();
  const keywordMap = loadKeywordMap();
  const lexicon = loadLexicon();
  const usageCounts = loadUsageCounts();
  const { hashLinkBase } = options ?? {};
  const usedBinaries = new Set<string>();
  const sections = corpus.sections.flatMap((section): CorpusRenderableSection[] => {
    const items: CorpusRenderableItem[] = [];

    for (const item of section.items) {
      if (item.type === 'paragraph') {
        if (!filterBinary) {
          items.push({
            type: 'paragraph',
            content: <InlineMdx source={item.text} hashLinkBase={hashLinkBase} />,
          });
        }
        continue;
      }

      const alevLines =
        item.alevLines === null
          ? null
          : item.alevLines.map((line) =>
              buildRenderableLine(line, keywordMap),
            );

      if (
        filterBinary &&
        !(
          alevLines !== null &&
          alevLines.some((line) => lineContainsBinary(line, filterBinary))
        )
      ) {
        continue;
      }

      if (alevLines !== null) {
        for (const line of alevLines) {
          for (const fragment of line) {
            if (fragment.type === 'glyph') {
              usedBinaries.add(fragment.binary);
            }
          }
        }
      }

      items.push({
        type: 'entry',
        position: item.position,
        anchor: item.anchor,
        japanese: item.japanese,
        alevLines,
        comments: item.comments.map((comment, commentIndex) => ({
          key: `${item.position}-comment-${commentIndex}`,
          content: <InlineMdx source={comment} hashLinkBase={hashLinkBase} />,
        })),
      });
    }

    return items.length > 0
      ? [
          {
            title: section.title,
            items,
          },
        ]
      : [];
  });

  return {
    sections,
    glyphByBinary: createRenderableGlyphMap(
      usedBinaries,
      (binary) => lexicon.get(binary),
      usageCounts,
    ),
  };
};
