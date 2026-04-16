'use client';

import type { FC } from 'react';

import AlevGlyphTrigger from './AlevGlyphTrigger';
import type { AlevRenderableFragment } from './alev-renderable';
import type { GlyphRenderableRecord } from './glyph-renderable';

type AlevRenderableFragmentsProps = {
  fragments: AlevRenderableFragment[];
  glyphMap: Map<string, GlyphRenderableRecord>;
  usageCounts: Record<string, number>;
  selectedHex?: string | null;
  onGlyphPress?: (hex: string) => void;
  togglePopoverOnClick?: boolean;
  triggerClassName: string;
  selectedTriggerClassName?: string;
  contentClassName?: string;
  keyPrefix: string;
};

const AlevRenderableFragments: FC<AlevRenderableFragmentsProps> = props => {
  const {
    fragments,
    glyphMap,
    usageCounts,
    selectedHex,
    onGlyphPress,
    togglePopoverOnClick = true,
    triggerClassName,
    selectedTriggerClassName,
    contentClassName,
    keyPrefix,
  } = props;

  return fragments.map((fragment, fragmentIndex) => {
    if (fragment.type === 'space' || fragment.type === 'bracket' || fragment.type === 'text') {
      return <span key={`${keyPrefix}-${fragmentIndex}`}>{fragment.value}</span>;
    }

    const glyph = glyphMap.get(fragment.hex);
    if (!glyph) {
      return <span key={`${keyPrefix}-${fragmentIndex}`}>{fragment.value}</span>;
    }

    const glyphSelected = selectedHex === fragment.hex;

    return (
      <AlevGlyphTrigger
        key={`${keyPrefix}-${fragmentIndex}-${glyph.hex}`}
        glyph={glyph}
        usageCount={usageCounts[glyph.hex] ?? 0}
        selected={glyphSelected}
        onPress={() => {
          onGlyphPress?.(fragment.hex);
        }}
        togglePopoverOnClick={togglePopoverOnClick}
        triggerClassName={triggerClassName}
        selectedTriggerClassName={selectedTriggerClassName}
        contentClassName={contentClassName}
        ariaLabel={`Show glyph ${glyph.hex}`}
      />
    );
  });
};

export default AlevRenderableFragments;
