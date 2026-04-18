'use client';

import type { FC } from 'react';

import { useAlevClientData } from '@/lib/alev-data-context';

import alevTextStyles from './AlevText.module.css';
import glyphTriggerStyles from './AlevGlyphTrigger.module.css';
import AlevRenderableFragments from './AlevRenderableFragments';
import { buildRenderableLine } from './alev-renderable';
import styles from './AlevInline.module.css';

type AlevInlineClientProps = {
  source: string;
};

const AlevInlineClient: FC<AlevInlineClientProps> = ({ source }) => {
  const { keywordMap } = useAlevClientData();
  const fragments = buildRenderableLine(source, keywordMap);

  return (
    <span className={`${styles.inline} ${alevTextStyles.glyphText}`} title={source}>
      <AlevRenderableFragments
        fragments={fragments}
        triggerClassName={glyphTriggerStyles.inlineGlyphTrigger}
        contentClassName={glyphTriggerStyles.inlineGlyph}
        keyPrefix={`alev-inline-${source}`}
      />
    </span>
  );
};

export default AlevInlineClient;
