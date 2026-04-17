import { Children, type FC, type ReactNode } from 'react';

import { normalizeAlevToken } from '@alev/data';

import { loadSourceData } from '@/lib/source-data';

import alevTextStyles from './AlevText.module.css';
import glyphTriggerStyles from './AlevGlyphTrigger.module.css';
import { buildRenderableLine } from './alev-renderable';
import AlevRenderableFragments from './AlevRenderableFragments';
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

  const sourceData = loadSourceData();
  const glyphHexSet = new Set(sourceData.glyphs.map((glyph) => glyph.hex));
  const fragments = buildRenderableLine(text, sourceData.keywordMap, glyphHexSet);

  return (
    <span className={`${styles.inline} ${alevTextStyles.glyphText}`} title={text}>
      <AlevRenderableFragments
        fragments={fragments}
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

  const { keywordMap } = loadSourceData();

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
