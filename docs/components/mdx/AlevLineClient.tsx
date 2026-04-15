'use client';

import { useMemo, type FC } from 'react';

import type { GlyphRecord } from '@/lib/alev';

import alevTextStyles from './AlevText.module.css';
import glyphTriggerStyles from './AlevGlyphTrigger.module.css';
import AlevRenderableFragments from './AlevRenderableFragments';
import styles from './AlevLine.module.css';
import type { AlevRenderableFragment } from './alev-renderable';

type AlevLineClientProps = {
  glyphs: GlyphRecord[];
  lines: AlevRenderableFragment[][];
  usageCounts: Record<string, number>;
  selectedHex?: string | null;
  onGlyphPress?: (hex: string) => void;
  togglePopoverOnClick?: boolean;
  className?: string;
  lineClassName?: string;
  lineKeyPrefix?: string;
  glyphTriggerClassName?: string;
  selectedGlyphTriggerClassName?: string;
  glyphContentClassName?: string;
};

function joinClassNames(...values: Array<string | undefined | false | null>): string {
  return values.filter(Boolean).join(' ');
}

const AlevLineClient: FC<AlevLineClientProps> = props => {
  const {
    glyphs,
    lines,
    usageCounts,
    selectedHex,
    onGlyphPress,
    togglePopoverOnClick = true,
    className,
    lineClassName,
    lineKeyPrefix = 'alev-line',
    glyphTriggerClassName,
    selectedGlyphTriggerClassName,
    glyphContentClassName,
  } = props;
  const glyphMap = useMemo(
    () => new Map(glyphs.map((glyph) => [glyph.hex, glyph])),
    [glyphs],
  );

  if (lines.length === 0) {
    return null;
  }

  return (
    <div className={joinClassNames(styles.block, className)}>
      {lines.map((line, lineIndex) => (
        <div
          key={`${lineKeyPrefix}-${lineIndex}`}
          className={joinClassNames(styles.line, alevTextStyles.glyphText, lineClassName)}
        >
          <AlevRenderableFragments
            fragments={line}
            glyphMap={glyphMap}
            usageCounts={usageCounts}
            selectedHex={selectedHex}
            onGlyphPress={onGlyphPress}
            togglePopoverOnClick={togglePopoverOnClick}
            triggerClassName={glyphTriggerClassName ?? glyphTriggerStyles.inlineGlyphTrigger}
            selectedTriggerClassName={selectedGlyphTriggerClassName ?? glyphTriggerStyles.inlineGlyphTriggerSelected}
            contentClassName={glyphContentClassName ?? glyphTriggerStyles.inlineGlyph}
            keyPrefix={`${lineKeyPrefix}-${lineIndex}`}
          />
        </div>
      ))}
    </div>
  );
};

export default AlevLineClient;
