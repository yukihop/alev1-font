import type { FC } from 'react';

import { resolveAlevTokenHex } from '@alev/data';

import { loadSourceData } from '@/lib/source-data';

import AlevLineClient from './AlevLineClient';
import { buildRenderableSource } from './alev-renderable';

type AlevLineProps = {
  source: string;
  selected?: string;
  className?: string;
};

function normalizeSelectedHex(
  value: string | undefined,
  keywordMap: Record<string, string>,
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
  const sourceData = loadSourceData();
  const glyphHexSet = new Set(sourceData.glyphs.map((glyph) => glyph.hex));
  const lines = buildRenderableSource(
    props.source,
    sourceData.keywordMap,
    glyphHexSet,
  );
  const selectedHex = normalizeSelectedHex(
    props.selected,
    sourceData.keywordMap,
    glyphHexSet,
  );

  return (
    <AlevLineClient
      lines={lines}
      selectedHex={selectedHex}
      className={props.className}
    />
  );
};

export default AlevLine;
