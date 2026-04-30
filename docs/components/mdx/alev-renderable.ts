import {
  binaryToHex,
  type KeywordMap,
  tokenizeAlevLine,
} from '@/lib/alev-shared';

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
      type: 'glyph';
      value: string;
      binary: string;
    };

export function buildRenderableLine(
  line: string,
  keywordLookup: KeywordMap,
): AlevRenderableFragment[] {
  const fragments = tokenizeAlevLine(line, keywordLookup);

  return fragments.flatMap<AlevRenderableFragment>((fragment, fragmentIndex) => {
    if (fragment.type === 'space' || fragment.type === 'bracket') {
      return [fragment];
    }

    if (!fragment.resolvedBinary) {
      throw new Error(`Unresolved ALEV token "${fragment.value}" in "${line}".`);
    }

    const nextFragment = fragments[fragmentIndex + 1];
    const needsSpacer = nextFragment?.type === 'token';

    return [
      {
        type: 'glyph',
        value: fragment.value,
        binary: fragment.resolvedBinary,
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
  keywordLookup: KeywordMap,
): AlevRenderableFragment[][] {
  const normalizedSource = String(source ?? '').replace(/\r\n?/g, '\n').trim();
  if (!normalizedSource) {
    return [];
  }

  return normalizedSource
    .split('\n')
    .map((line) => buildRenderableLine(line.trim(), keywordLookup));
}

export function buildCopySequence(
  lines: AlevRenderableFragment[][],
  mode: 'hex' | 'bin',
): string {
  return lines
    .map((line) =>
      line
        .map((fragment) => {
          if (fragment.type === 'glyph') {
            return mode === 'hex'
              ? `0x${binaryToHex(fragment.binary)}`
              : `0b${fragment.binary}`;
          }

          return fragment.value;
        })
        .join(''),
    )
    .join('\n');
}

export function collectRenderableBinaries(
  lines: AlevRenderableFragment[][],
): string[] {
  const binaries = new Set<string>();

  for (const line of lines) {
    for (const fragment of line) {
      if (fragment.type === 'glyph') {
        binaries.add(fragment.binary);
      }
    }
  }

  return [...binaries];
}
