import { Children, type FC, type ReactNode } from 'react';

import { renderAlevContent } from '@/lib/alev';

import alevTextStyles from './AlevText.module.css';
import styles from './AlevInline.module.css';

type AlevInlineProps = {
  source?: string;
  children?: ReactNode;
};

const textFromChildren = (children: ReactNode): string => {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === 'string') return child;
      if (typeof child === 'number') return String(child);
      return '';
    })
    .join(' ');
};

const AlevInline: FC<AlevInlineProps> = props => {
  const { source = '', children } = props;
  const text = source || textFromChildren(children);

  return (
    <span className={`${styles.inline} ${alevTextStyles.glyphText}`} title={text}>
      {renderAlevContent(text)}
    </span>
  );
};

export default AlevInline;
