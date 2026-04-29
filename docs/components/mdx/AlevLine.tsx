import type { FC } from 'react';

import { loadKeywordMap } from '@/lib/alev';
import { resolveAlevTokenBinary } from '@/lib/alev-shared';

import AlevLineClient from './AlevLineClient';
import {
  buildCopySequence,
  buildRenderableSource,
} from './alev-renderable';

type AlevLineProps = {
  source: string;
  selected?: string;
  className?: string;
};

function normalizeSelectedCharacterId(
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
  const keywordMap = loadKeywordMap();
  const selectedCharacterId = normalizeSelectedCharacterId(
    props.selected,
    keywordMap,
  );
  const lines = buildRenderableSource(props.source, keywordMap);

  return (
    <AlevLineClient
      lines={lines}
      hexCopy={buildCopySequence(lines, 'hex')}
      binaryCopy={buildCopySequence(lines, 'bin')}
      selectedCharacterId={selectedCharacterId}
      className={props.className}
    />
  );
};

export default AlevLine;
