import { type KeywordLookup, tokenizeAlevLine } from '@/lib/alev-tokens';

export type AlevRenderableFragment =
  | {
      type: 'space';
      value: string;
    }
  | {
      type: 'bracket';
      value: '[' | ']';
    }
  | {
      type: 'text';
      value: string;
    }
  | {
      type: 'glyph';
      value: string;
      hex: string;
    };

export type AlevRenderableCommentSegment =
  | {
      type: 'text';
      value: string;
    }
  | {
      type: 'alev';
      fragments: AlevRenderableFragment[];
    };

export function buildRenderableLine(
  line: string,
  keywordLookup: KeywordLookup,
  glyphHexSet: Set<string>,
): AlevRenderableFragment[] {
  const fragments = tokenizeAlevLine(line, keywordLookup);

  return fragments.flatMap<AlevRenderableFragment>((fragment, fragmentIndex) => {
    if (fragment.type === 'space' || fragment.type === 'bracket') {
      return [fragment];
    }

    if (!fragment.resolvedHex || !glyphHexSet.has(fragment.resolvedHex)) {
      return [
        {
          type: 'text',
          value: fragment.value,
        },
      ];
    }

    const nextFragment = fragments[fragmentIndex + 1];
    const needsSpacer = nextFragment?.type === 'token';

    return [
      {
        type: 'glyph',
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
}

export function buildRenderableSource(
  source: string,
  keywordLookup: KeywordLookup,
  glyphHexSet: Set<string>,
): AlevRenderableFragment[][] {
  const normalizedSource = String(source ?? '').replace(/\r\n?/g, '\n').trim();
  if (!normalizedSource) {
    return [];
  }

  return normalizedSource
    .split('\n')
    .map((line) => buildRenderableLine(line.trim(), keywordLookup, glyphHexSet));
}

export function buildRenderableComment(
  comment: string,
  keywordLookup: KeywordLookup,
  glyphHexSet: Set<string>,
): AlevRenderableCommentSegment[] {
  const pattern = /:([^:\n]+):/g;
  let match: RegExpExecArray | null;
  let cursor = 0;
  const segments: AlevRenderableCommentSegment[] = [];

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
      fragments: buildRenderableLine(inner.trim(), keywordLookup, glyphHexSet),
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
}
