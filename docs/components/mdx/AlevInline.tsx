import type { FC, ReactNode } from 'react';

import { getGlyphHexSet, getKeywordMap } from '@/lib/alev';

import AlevInlineClient from './AlevInlineClient';
import { buildRenderableLine } from './alev-renderable';
import { resolveAlevInlineSource } from './alev-inline-source';

type AlevInlineProps = {
  source?: string;
  children?: ReactNode;
};

const AlevInline: FC<AlevInlineProps> = props => {
  const text = resolveAlevInlineSource(props.source, props.children);
  if (!text) {
    return null;
  }

  const keywordMap = getKeywordMap();
  const glyphHexSet = getGlyphHexSet();
  const fragments = buildRenderableLine(text, keywordMap, glyphHexSet);

  return (
    <AlevInlineClient
      fragments={fragments}
      title={text}
      keyPrefix={`alev-inline-${text}`}
    />
  );
};

export default AlevInline;
