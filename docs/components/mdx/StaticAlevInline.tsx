import type { FC, ReactNode } from 'react';

import { renderAlevContent } from '@/lib/alev';

import alevTextStyles from './AlevText.module.css';
import styles from './AlevInline.module.css';
import { resolveAlevInlineSource } from './alev-inline-source';

type StaticAlevInlineProps = {
  source?: string;
  children?: ReactNode;
};

const StaticAlevInline: FC<StaticAlevInlineProps> = (props) => {
  const text = resolveAlevInlineSource(props.source, props.children);
  if (!text) {
    return null;
  }

  return (
    <span className={`${styles.inline} ${alevTextStyles.glyphText}`} title={text}>
      {renderAlevContent(text)}
    </span>
  );
};

export default StaticAlevInline;
