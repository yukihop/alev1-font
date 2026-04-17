'use client';

import type { FC } from 'react';

import AlevGlyphTrigger from './AlevGlyphTrigger';
import { useSourceData } from './SourceDataProvider';
import type { AlevRenderableFragment } from './alev-renderable';

type AlevRenderableFragmentsProps = {
  fragments: AlevRenderableFragment[];
  selectedHex?: string | null;
  triggerClassName: string;
  selectedTriggerClassName?: string;
  contentClassName?: string;
  keyPrefix: string;
};

const AlevRenderableFragments: FC<AlevRenderableFragmentsProps> = props => {
  const {
    fragments,
    selectedHex,
    triggerClassName,
    selectedTriggerClassName,
    contentClassName,
    keyPrefix,
  } = props;
  const {
    glyphMap,
    sourceData: { usageCounts },
  } = useSourceData();

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
        triggerClassName={triggerClassName}
        selectedTriggerClassName={selectedTriggerClassName}
        contentClassName={contentClassName}
        ariaLabel={`Show glyph ${glyph.hex}`}
      />
    );
  });
};

export default AlevRenderableFragments;
