'use client';

import type { FC } from 'react';

import alevTextStyles from './AlevText.module.css';
import glyphTriggerStyles from './AlevGlyphTrigger.module.css';
import AlevRenderableFragments from './AlevRenderableFragments';
import styles from './AlevInline.module.css';
import type { AlevRenderableFragment } from './alev-renderable';

type AlevInlineClientProps = {
  fragments: AlevRenderableFragment[];
  title: string;
  className?: string;
  keyPrefix?: string;
};

function joinClassNames(
  ...values: Array<string | undefined | false | null>
): string {
  return values.filter(Boolean).join(' ');
}

const AlevInlineClient: FC<AlevInlineClientProps> = (props) => {
  const {
    fragments,
    title,
    className,
    keyPrefix = 'alev-inline',
  } = props;

  if (fragments.length === 0) {
    return null;
  }

  return (
    <span
      className={joinClassNames(styles.inline, alevTextStyles.glyphText, className)}
      title={title}
    >
      <AlevRenderableFragments
        fragments={fragments}
        triggerClassName={glyphTriggerStyles.inlineGlyphTrigger}
        contentClassName={glyphTriggerStyles.inlineGlyph}
        keyPrefix={keyPrefix}
      />
    </span>
  );
};

export default AlevInlineClient;
