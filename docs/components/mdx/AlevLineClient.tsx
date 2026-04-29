'use client';

import type { FC } from 'react';
import { useRef, useState } from 'react';

import alevTextStyles from './AlevText.module.css';
import { CheckIcon, CopyIcon, useCopyFeedback } from './CopyPillButton';
import glyphTriggerStyles from './AlevGlyphTrigger.module.css';
import AlevRenderableFragments from './AlevRenderableFragments';
import styles from './AlevLine.module.css';
import type { AlevRenderableFragment } from './alev-renderable';

type AlevLineClientProps = {
  lines: AlevRenderableFragment[][];
  hexCopy: string;
  binaryCopy: string;
  selectedCharacterId?: string | null;
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

const AlevLineClient: FC<AlevLineClientProps> = props => {
  const {
    lines,
    hexCopy,
    binaryCopy,
    selectedCharacterId,
    className,
    lineClassName,
    lineKeyPrefix = 'alev-line',
    glyphTriggerClassName,
    selectedGlyphTriggerClassName,
    glyphContentClassName,
    showCopyActions = true,
  } = props;
  const { copiedId, copyText } = useCopyFeedback();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapRef = useRef<HTMLDivElement | null>(null);

  if (lines.length === 0) {
    return null;
  }

  const copyMenuId = `${lineKeyPrefix}-copy-menu`;

  const copyFromMenu = (copyId: string, copyValue: string) => {
    void copyText(copyId, copyValue);
    setMenuOpen(false);
  };

  return (
    <div
      className={joinClassNames(
        styles.wrap,
        showCopyActions && styles.wrapWithCopyMenu,
        className,
      )}
    >
      <div className={styles.block}>
        {lines.map((line, lineIndex) => (
          <div
            key={`${lineKeyPrefix}-${lineIndex}`}
            className={joinClassNames(styles.line, alevTextStyles.glyphText, lineClassName)}
          >
            <AlevRenderableFragments
              fragments={line}
              selectedCharacterId={selectedCharacterId}
              triggerClassName={glyphTriggerClassName ?? glyphTriggerStyles.inlineGlyphTrigger}
              selectedTriggerClassName={selectedGlyphTriggerClassName ?? glyphTriggerStyles.inlineGlyphTriggerSelected}
              contentClassName={glyphContentClassName ?? glyphTriggerStyles.inlineGlyph}
              keyPrefix={`${lineKeyPrefix}-${lineIndex}`}
            />
          </div>
        ))}
      </div>
      {showCopyActions ? (
        <div
          ref={menuWrapRef}
          className={styles.copyMenuWrap}
          onBlur={(event) => {
            const nextFocus = event.relatedTarget as Node | null;
            if (!nextFocus || !menuWrapRef.current?.contains(nextFocus)) {
              setMenuOpen(false);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setMenuOpen(false);
            }
          }}
        >
          <button
            type="button"
            className={styles.copyMenuTrigger}
            aria-label="Open copy menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls={copyMenuId}
            onClick={() => {
              setMenuOpen(current => !current);
            }}
          >
            <EllipsisIcon className={styles.copyMenuTriggerIcon} />
          </button>
          {menuOpen ? (
            <div
              id={copyMenuId}
              className={styles.copyMenu}
              role="menu"
              aria-label="Copy sequence"
            >
              <button
                type="button"
                className={styles.copyMenuItem}
                role="menuitem"
                onClick={() => {
                  copyFromMenu(`${lineKeyPrefix}-hex`, hexCopy);
                }}
              >
                {copiedId === `${lineKeyPrefix}-hex` ? (
                  <CheckIcon className={styles.copyMenuItemIcon} />
                ) : (
                  <CopyIcon className={styles.copyMenuItemIcon} />
                )}
                <span>Copy as hex</span>
              </button>
              <button
                type="button"
                className={styles.copyMenuItem}
                role="menuitem"
                onClick={() => {
                  copyFromMenu(`${lineKeyPrefix}-bin`, binaryCopy);
                }}
              >
                {copiedId === `${lineKeyPrefix}-bin` ? (
                  <CheckIcon className={styles.copyMenuItemIcon} />
                ) : (
                  <CopyIcon className={styles.copyMenuItemIcon} />
                )}
                <span>Copy as bin</span>
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const EllipsisIcon: FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 16 16"
    aria-hidden="true"
    className={className}
    fill="currentColor"
  >
    <circle cx="4" cy="8" r="1.35" />
    <circle cx="8" cy="8" r="1.35" />
    <circle cx="12" cy="8" r="1.35" />
  </svg>
);

export default AlevLineClient;
