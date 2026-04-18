'use client';

import type { FC } from 'react';

import AlevGlyphTrigger from './AlevGlyphTrigger';
import type { AlevRenderableFragment } from './alev-renderable';
import type { RenderableGlyphMap } from './glyph-record';

type AlevRenderableFragmentsProps = {
  fragments: AlevRenderableFragment[];
  glyphByBinary: RenderableGlyphMap;
  selectedBinary?: string | null;
  triggerClassName: string;
  selectedTriggerClassName?: string;
  contentClassName?: string;
  keyPrefix: string;
};

const AlevRenderableFragments: FC<AlevRenderableFragmentsProps> = props => {
  const {
    fragments,
    glyphByBinary,
    selectedBinary,
    triggerClassName,
    selectedTriggerClassName,
    contentClassName,
    keyPrefix,
  } = props;

  return fragments.map((fragment, fragmentIndex) => {
    if (fragment.type === 'space' || fragment.type === 'bracket' || fragment.type === 'text') {
      return <span key={`${keyPrefix}-${fragmentIndex}`}>{fragment.value}</span>;
    }

    const glyph = glyphByBinary[fragment.binary];
    if (!glyph) {
      throw new Error(`Missing glyph metadata for binary ${fragment.binary}.`);
    }

    const glyphSelected = selectedBinary === fragment.binary;

    return (
      <AlevGlyphTrigger
        key={`${keyPrefix}-${fragmentIndex}-${glyph.hex}`}
        glyph={glyph}
        selected={glyphSelected}
        triggerClassName={triggerClassName}
        selectedTriggerClassName={selectedTriggerClassName}
        contentClassName={contentClassName}
        ariaLabel={`Show glyph ${glyph.hex}`}
      />
    );
  });
};

export default AlevRenderableFragments;
