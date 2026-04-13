import type { FC, ReactNode } from 'react';

import styles from './RichText.module.css';

type RichTextProps = {
  children: ReactNode;
};

const RichText: FC<RichTextProps> = props => {
  const { children } = props;
  return <article className={styles.richText}>{children}</article>;
};

export default RichText;
