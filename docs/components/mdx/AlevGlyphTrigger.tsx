'use client';

import type { FC } from 'react';

import GlyphPopoverTrigger from './GlyphPopoverTrigger';

type AlevGlyphTriggerProps = {
  characterId: string;
  selected?: boolean;
  triggerClassName: string;
  selectedTriggerClassName?: string;
  contentClassName?: string;
};

function joinClassNames(...values: Array<string | undefined | false | null>): string {
  return values.filter(Boolean).join(' ');
}

const AlevGlyphTrigger: FC<AlevGlyphTriggerProps> = props => {
  const {
    characterId,
    selected = false,
    triggerClassName,
    selectedTriggerClassName,
    contentClassName,
  } = props;

  return (
    <GlyphPopoverTrigger
      characterId={characterId}
      className={joinClassNames(triggerClassName, selected && selectedTriggerClassName)}
      contentClassName={contentClassName}
      current={selected}
    />
  );
};

export default AlevGlyphTrigger;
