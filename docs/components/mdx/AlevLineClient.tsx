'use client';

import type { FC } from 'react';

import alevTextStyles from './AlevText.module.css';
import { CheckIcon, CopyIcon, useCopyFeedback } from './CopyPillButton';
import glyphTriggerStyles from './AlevGlyphTrigger.module.css';
import AlevRenderableFragments from './AlevRenderableFragments';
import styles from './AlevLine.module.css';
import type { AlevRenderableFragment } from './alev-renderable';

type AlevLineClientProps = {
  lines: AlevRenderableFragment[][];
  selectedHex?: string | null;
  onGlyphPress?: (hex: string) => void;
  togglePopoverOnClick?: boolean;
  className?: string;
  lineClassName?: string;
  lineKeyPrefix?: string;
  glyphTriggerClassName?: string;
  selectedGlyphTriggerClassName?: string;
  glyphContentClassName?: string;
  showCopyActions?: boolean;
};

function joinClassNames(...values: Array<string | undefined | false | null>): string {
  return values.filter(Boolean).join(' ');
}

function hexToBinary(hex: string): string {
  return Number.parseInt(hex, 16).toString(2).padStart(8, '0');
}

function buildCopySequence(
  lines: AlevRenderableFragment[][],
  mode: 'hex' | 'bin',
): string {
  return lines
    .map((line) =>
      line
        .map((fragment) => {
          if (fragment.type === 'glyph') {
            return mode === 'hex'
              ? `0x${fragment.hex}`
              : `0b${hexToBinary(fragment.hex)}`;
          }

          return fragment.value;
        })
        .join(''),
    )
    .join('\n');
}

const AlevLineClient: FC<AlevLineClientProps> = props => {
  const {
    lines,
    selectedHex,
    onGlyphPress,
    togglePopoverOnClick = true,
    className,
    lineClassName,
    lineKeyPrefix = 'alev-line',
    glyphTriggerClassName,
    selectedGlyphTriggerClassName,
    glyphContentClassName,
    showCopyActions = true,
  } = props;
  const { copiedId, copyText } = useCopyFeedback();

  if (lines.length === 0) {
    return null;
  }

  const hexCopy = buildCopySequence(lines, 'hex');
  const binaryCopy = buildCopySequence(lines, 'bin');

  return (
    <div className={joinClassNames(styles.wrap, className)}>
      <div className={styles.block}>
        {lines.map((line, lineIndex) => (
          <div
            key={`${lineKeyPrefix}-${lineIndex}`}
            className={joinClassNames(styles.line, alevTextStyles.glyphText, lineClassName)}
          >
            <AlevRenderableFragments
              fragments={line}
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
      {showCopyActions ? (
        <div className={styles.copyActions}>
          <button
            type="button"
            className={styles.copyButton}
            aria-label="Copy hex sequence"
            onClick={() => {
              void copyText(`${lineKeyPrefix}-hex`, hexCopy);
            }}
          >
            <span>hex</span>
            {copiedId === `${lineKeyPrefix}-hex` ? (
              <CheckIcon className={styles.copyIcon} />
            ) : (
              <CopyIcon className={styles.copyIcon} />
            )}
          </button>
          <button
            type="button"
            className={styles.copyButton}
            aria-label="Copy binary sequence"
            onClick={() => {
              void copyText(`${lineKeyPrefix}-bin`, binaryCopy);
            }}
          >
            <span>bin</span>
            {copiedId === `${lineKeyPrefix}-bin` ? (
              <CheckIcon className={styles.copyIcon} />
            ) : (
              <CopyIcon className={styles.copyIcon} />
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default AlevLineClient;
