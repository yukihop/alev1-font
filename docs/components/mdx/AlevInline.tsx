import { Children, type FC, type ReactNode } from 'react';

import { loadKeywordMap } from '@/lib/alev';
import {
  normalizeAlevSourceToBinaryText,
  normalizeAlevToken,
} from '@/lib/alev-shared';

import alevTextStyles from './AlevText.module.css';
import AlevInlineClient from './AlevInlineClient';
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

  normalizeAlevSourceToBinaryText(text, loadKeywordMap());

  return <AlevInlineClient source={text} />;
};

export const StaticAlevInline: FC<AlevInlineProps> = props => {
  const text = resolveAlevInlineSource(props.source, props.children);
  if (!text) {
    return null;
  }

  const keywordMap = loadKeywordMap();
  normalizeAlevSourceToBinaryText(text, keywordMap);

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
