import type { FC } from 'react';

import { getAlevData, getKeywordMap } from '@/lib/alev';
import { tokenizeAlevLine } from '@/lib/alev-tokens';
import { getCorpusUsageCounts, loadCorpusDocument } from '@/lib/corpus';

import CorpusViewClient, {
  type CorpusRenderableFragment,
  type CorpusRenderableCommentSegment,
  type CorpusRenderableSection,
} from './CorpusViewClient';

const buildRenderableLine = (
  line: string,
  keywordMap: ReturnType<typeof getKeywordMap>,
  glyphHexSet: Set<string>,
): CorpusRenderableFragment[] => {
  const fragments = tokenizeAlevLine(line, keywordMap);

  return fragments.flatMap<CorpusRenderableFragment>((fragment, fragmentIndex) => {
    if (fragment.type === 'space' || fragment.type === 'bracket') {
      return [fragment];
    }

    if (!fragment.resolvedHex || !glyphHexSet.has(fragment.resolvedHex)) {
      return [
        {
          type: 'text' as const,
          value: fragment.value,
        },
      ];
    }

    const nextFragment = fragments[fragmentIndex + 1];
    const needsSpacer = nextFragment?.type === 'token';

    return [
      {
        type: 'glyph' as const,
        value: fragment.value,
        hex: fragment.resolvedHex,
      },
      ...(needsSpacer
        ? [
            {
              type: 'space' as const,
              value: ' ',
            },
          ]
        : []),
    ];
  });
};

const buildRenderableComment = (
  comment: string,
  keywordMap: ReturnType<typeof getKeywordMap>,
  glyphHexSet: Set<string>,
): CorpusRenderableCommentSegment[] => {
  const pattern = /:([^:\n]+):/g;
  let match: RegExpExecArray | null;
  let cursor = 0;
  const segments: CorpusRenderableCommentSegment[] = [];

  while ((match = pattern.exec(comment)) !== null) {
    const [raw, inner] = match;

    if (match.index > cursor) {
      segments.push({
        type: 'text',
        value: comment.slice(cursor, match.index),
      });
    }

    segments.push({
      type: 'alev',
      fragments: buildRenderableLine(inner.trim(), keywordMap, glyphHexSet),
    });

    cursor = match.index + raw.length;
  }

  if (segments.length === 0) {
    return [
      {
        type: 'text',
        value: comment,
      },
    ];
  }

  if (cursor < comment.length) {
    segments.push({
      type: 'text',
      value: comment.slice(cursor),
    });
  }

  return segments;
};

const CorpusView: FC = () => {
  const document = loadCorpusDocument();
  const { glyphs } = getAlevData();
  const keywordMap = getKeywordMap();
  const usageCounts = getCorpusUsageCounts();
  const glyphHexSet = new Set(glyphs.map((glyph) => glyph.hex));
  const sections: CorpusRenderableSection[] = document.sections.map((section) => ({
    title: section.title,
    entries: section.entries.map((entry) => ({
      position: entry.position,
      japanese: entry.japanese,
      alevLines:
        entry.alevLines === null
          ? null
          : entry.alevLines.map((line) =>
              buildRenderableLine(line, keywordMap, glyphHexSet),
            ),
      comments: entry.comments.map((comment) =>
        buildRenderableComment(comment, keywordMap, glyphHexSet),
      ),
    })),
  }));

  return <CorpusViewClient glyphs={glyphs} sections={sections} usageCounts={usageCounts} />;
};

export default CorpusView;
