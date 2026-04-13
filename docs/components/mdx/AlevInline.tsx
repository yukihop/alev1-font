import { Children, type ReactNode } from 'react';

import { renderAlevContent } from '@/lib/alev';

import styles from './AlevInline.module.css';

type AlevInlineProps = {
  source?: string;
  children?: ReactNode;
};

function textFromChildren(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === 'string') return child;
      if (typeof child === 'number') return String(child);
      return '';
    })
    .join(' ');
}

export default function AlevInline(props: AlevInlineProps) {
  const { source = '', children } = props;
  const text = source || textFromChildren(children);

  return (
    <span className={styles.inline} title={text}>
      {renderAlevContent(text)}
    </span>
  );
}
