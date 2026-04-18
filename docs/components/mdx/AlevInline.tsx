import { Children, type FC, type ReactNode } from 'react';

import {
  loadKeywordMap,
  loadLexicon,
  loadUsageCounts,
} from '@/lib/alev';
import { normalizeAlevToken } from '@/lib/alev-shared';

import alevTextStyles from './AlevText.module.css';
import glyphTriggerStyles from './AlevGlyphTrigger.module.css';
import { buildRenderableLine } from './alev-renderable';
import AlevRenderableFragments from './AlevRenderableFragments';
import { createRenderableGlyphMap } from './glyph-record';
import styles from './AlevInline.module.css';

type AlevInlineProps = {
  source?: string;
  children?: ReactNode;
};

function resolveAlevInlineSource(source?: string, children?: ReactNode): string {
  const text =
    source ??
    Children.toArray(children)
      .map((child) => {
        if (typeof child === 'string') return child;
        if (typeof child === 'number') return String(child);
        return '';
      })
      .join(' ');

  return String(text ?? '').replace(/\s+/g, ' ').trim();
}

const AlevInline: FC<AlevInlineProps> = props => {
  const text = resolveAlevInlineSource(props.source, props.children);
  if (!text) {
    return null;
  }

  const lexicon = loadLexicon();
  const keywordMap = loadKeywordMap();
  const usageCounts = loadUsageCounts();
  const fragments = buildRenderableLine(text, keywordMap);
  const glyphByBinary = createRenderableGlyphMap(
    fragments.flatMap((fragment) =>
      fragment.type === 'glyph' ? [fragment.binary] : [],
    ),
    (binary) => lexicon.get(binary),
    usageCounts,
  );

  return (
    <span className={`${styles.inline} ${alevTextStyles.glyphText}`} title={text}>
      <AlevRenderableFragments
        fragments={fragments}
        glyphByBinary={glyphByBinary}
        triggerClassName={glyphTriggerStyles.inlineGlyphTrigger}
        contentClassName={glyphTriggerStyles.inlineGlyph}
        keyPrefix={`alev-inline-${text}`}
      />
    </span>
  );
};

export const StaticAlevInline: FC<AlevInlineProps> = props => {
  const text = resolveAlevInlineSource(props.source, props.children);
  if (!text) {
    return null;
  }

  const keywordMap = loadKeywordMap();

  return (
    <span className={`${styles.inline} ${alevTextStyles.glyphText}`} title={text}>
      {text
        .split(/\s+/)
        .map((token) => normalizeAlevToken(token, keywordMap))
        .join(' ')}
    </span>
  );
};

export default AlevInline;
