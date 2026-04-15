import type { FC } from 'react';

import { getAlevData, getKeywordMap, resolveAlevTokenHex } from '@/lib/alev';
import { getCorpusUsageCounts } from '@/lib/corpus';

import AlevLineClient from './AlevLineClient';
import { buildRenderableSource } from './alev-renderable';

type AlevLineProps = {
  source: string;
  selected?: string;
  className?: string;
};

function normalizeSelectedHex(
  value: string | undefined,
  keywordMap: ReturnType<typeof getKeywordMap>,
  glyphHexSet: Set<string>,
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

  const resolvedHex = resolveAlevTokenHex(normalized, keywordMap);
  if (!resolvedHex || !glyphHexSet.has(resolvedHex)) {
    throw new Error(`AlevLine selected must resolve to a valid glyph, received "${value}".`);
  }

  return resolvedHex;
}

const AlevLine: FC<AlevLineProps> = props => {
  const { glyphs } = getAlevData();
  const keywordMap = getKeywordMap();
  const usageCounts = getCorpusUsageCounts();
  const glyphHexSet = new Set(glyphs.map((glyph) => glyph.hex));
  const lines = buildRenderableSource(props.source, keywordMap, glyphHexSet);
  const selectedHex = normalizeSelectedHex(props.selected, keywordMap, glyphHexSet);

  return (
    <AlevLineClient
      glyphs={glyphs}
      lines={lines}
      usageCounts={usageCounts}
      selectedHex={selectedHex}
      className={props.className}
    />
  );
};

export default AlevLine;
