'use client';

import type { FC } from 'react';

import AlevGlyphTrigger from './AlevGlyphTrigger';
import type { AlevRenderableFragment } from './alev-renderable';

type AlevRenderableFragmentsProps = {
  fragments: AlevRenderableFragment[];
  selectedCharacterId?: string | null;
  triggerClassName: string;
  selectedTriggerClassName?: string;
  contentClassName?: string;
  keyPrefix: string;
};

const AlevRenderableFragments: FC<AlevRenderableFragmentsProps> = props => {
  const {
    fragments,
    selectedCharacterId,
    triggerClassName,
    selectedTriggerClassName,
    contentClassName,
    keyPrefix,
  } = props;

  return fragments.map((fragment, fragmentIndex) => {
    if (fragment.type === 'space' || fragment.type === 'bracket' || fragment.type === 'text') {
      return <span key={`${keyPrefix}-${fragmentIndex}`}>{fragment.value}</span>;
    }
    const glyphSelected = selectedCharacterId === fragment.binary;

    return (
      <AlevGlyphTrigger
        key={`${keyPrefix}-${fragmentIndex}-${fragment.binary}`}
        characterId={fragment.binary}
        selected={glyphSelected}
        triggerClassName={triggerClassName}
        selectedTriggerClassName={selectedTriggerClassName}
        contentClassName={contentClassName}
        ariaLabel={`Show character ${fragment.binary}`}
      />
    );
  });
};

export default AlevRenderableFragments;
