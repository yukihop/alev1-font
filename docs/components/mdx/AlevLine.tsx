import type { FC } from 'react';

import {
  loadKeywordMap,
  loadLexicon,
  loadUsageCounts,
} from '@/lib/alev';
import { resolveAlevTokenBinary } from '@/lib/alev-shared';

import AlevLineClient from './AlevLineClient';
import { buildRenderableSource, collectRenderableBinaries } from './alev-renderable';
import { createRenderableGlyphMap } from './glyph-record';

type AlevLineProps = {
  source: string;
  selected?: string;
  className?: string;
};

function normalizeSelectedHex(
  value: string | undefined,
  keywordMap: Record<string, string>,
): string | null {
  if (value == null || value === '') {
    return null;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return null;
  }

  if (/\s/.test(normalized)) {
    throw new Error(`AlevLine selected must resolve from a single token, received "${value}".`);
  }

  const resolvedBinary = resolveAlevTokenBinary(normalized, keywordMap);
  if (!resolvedBinary) {
    throw new Error(`AlevLine selected must resolve to a valid glyph, received "${value}".`);
  }

  return resolvedBinary;
}

const AlevLine: FC<AlevLineProps> = props => {
  const lexicon = loadLexicon();
  const keywordMap = loadKeywordMap();
  const usageCounts = loadUsageCounts();
  const lines = buildRenderableSource(props.source, keywordMap);
  const glyphByBinary = createRenderableGlyphMap(
    collectRenderableBinaries(lines),
    (binary) => lexicon.get(binary),
    usageCounts,
  );
  const selectedBinary = normalizeSelectedHex(
    props.selected,
    keywordMap,
  );

  return (
    <AlevLineClient
      lines={lines}
      glyphByBinary={glyphByBinary}
      selectedBinary={selectedBinary}
      className={props.className}
    />
  );
};

export default AlevLine;
