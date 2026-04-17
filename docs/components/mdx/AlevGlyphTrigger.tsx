'use client';

import type { FC } from 'react';

import GlyphPopoverTrigger from './GlyphPopoverTrigger';
import type { RenderableGlyphRecord } from './SourceDataProvider';

type AlevGlyphTriggerProps = {
  glyph: RenderableGlyphRecord;
  usageCount?: number;
  selected?: boolean;
  onPress?: () => void;
  togglePopoverOnClick?: boolean;
  triggerClassName: string;
  selectedTriggerClassName?: string;
  contentClassName?: string;
  ariaLabel?: string;
};

function joinClassNames(...values: Array<string | undefined | false | null>): string {
  return values.filter(Boolean).join(' ');
}

const AlevGlyphTrigger: FC<AlevGlyphTriggerProps> = props => {
  const {
    glyph,
    usageCount,
    selected = false,
    onPress,
    togglePopoverOnClick = true,
    triggerClassName,
    selectedTriggerClassName,
    contentClassName,
    ariaLabel,
  } = props;

  return (
    <GlyphPopoverTrigger
      glyph={glyph}
      className={joinClassNames(triggerClassName, selected && selectedTriggerClassName)}
      contentClassName={contentClassName}
      ariaLabel={ariaLabel ?? `Show glyph ${glyph.hex}`}
      pressed={selected}
      usageCount={usageCount}
      togglePopoverOnClick={togglePopoverOnClick}
      onPress={onPress}
    />
  );
};

export default AlevGlyphTrigger;
