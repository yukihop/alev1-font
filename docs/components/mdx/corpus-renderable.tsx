import { loadSourceData } from '@/lib/source-data';

import type {
  CorpusRenderableItem,
  CorpusRenderableSection,
} from './CorpusViewClient';
import InlineMdx from './InlineMdx';
import { buildRenderableLine } from './alev-renderable';

function lineContainsHex(
  line: ReturnType<typeof buildRenderableLine>,
  hex: string,
): boolean {
  return line.some((fragment) => fragment.type === 'glyph' && fragment.hex === hex);
}

export const buildCorpusRenderableSections = (
  filterHex?: string,
): CorpusRenderableSection[] => {
  const sourceData = loadSourceData();
  const glyphHexSet = new Set(sourceData.glyphs.map((glyph) => glyph.hex));

  return sourceData.corpus.sections.flatMap((section): CorpusRenderableSection[] => {
    const items: CorpusRenderableItem[] = [];

    for (const item of section.items) {
      if (item.type === 'paragraph') {
        if (!filterHex) {
          items.push({
            type: 'paragraph',
            content: <InlineMdx source={item.text} />,
          });
        }
        continue;
      }

      const alevLines =
        item.alevLines === null
          ? null
          : item.alevLines.map((line) =>
              buildRenderableLine(line, sourceData.keywordMap, glyphHexSet),
            );

      if (
        filterHex &&
        !(
          alevLines !== null &&
          alevLines.some((line) => lineContainsHex(line, filterHex))
        )
      ) {
        continue;
      }

      items.push({
        type: 'entry',
        position: item.position,
        anchor: item.anchor,
        japanese: item.japanese,
        alevLines,
        comments: item.comments.map((comment, commentIndex) => ({
          key: `${item.position}-comment-${commentIndex}`,
          content: <InlineMdx source={comment} />,
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
};
