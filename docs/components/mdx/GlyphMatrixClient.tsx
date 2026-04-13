'use client';

import type { FC } from 'react';
import { useRef, useState } from 'react';

import type { GlyphRecord } from '@/lib/alev';

import CopyPillButton, { useCopyFeedback } from './CopyPillButton';
import styles from './Glyphs.module.css';

type GlyphMatrixPanelProps = {
  glyphs: GlyphRecord[];
  rows: string[];
  cols: string[];
};

const GlyphMatrixClient: FC<GlyphMatrixPanelProps> = props => {
  const { glyphs, rows, cols } = props;
  const glyphMap = new Map(glyphs.map(glyph => [glyph.hex, glyph]));
  const triggerRefs = useRef(new Map<string, HTMLButtonElement | null>());
  const popoverRefs = useRef(new Map<string, HTMLDivElement | null>());
  const hideTimerRef = useRef<number | null>(null);
  const [activeHex, setActiveHex] = useState<string | null>(null);
  const { copiedId, copyText } = useCopyFeedback();

  const clearHideTimer = () => {
    if (hideTimerRef.current === null) {
      return;
    }

    window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = null;
  };

  const hidePopover = (hex: string) => {
    clearHideTimer();
    popoverRefs.current.get(hex)?.hidePopover();
    setActiveHex(current => (current === hex ? null : current));
  };

  const positionPopover = (hex: string) => {
    const trigger = triggerRefs.current.get(hex);
    const popover = popoverRefs.current.get(hex);
    if (!trigger || !popover) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    popover.style.top = `${rect.bottom + window.scrollY + 8}px`;
    popover.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
    popover.style.transform = 'translateX(-50%)';
  };

  const showPopover = (hex: string) => {
    clearHideTimer();

    if (activeHex && activeHex !== hex) {
      popoverRefs.current.get(activeHex)?.hidePopover();
    }

    positionPopover(hex);
    popoverRefs.current.get(hex)?.showPopover();
    setActiveHex(hex);
  };

  const scheduleHide = (hex: string) => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      hidePopover(hex);
    }, 90);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.matrixWrap}>
        <table className={styles.matrix}>
          <thead>
            <tr>
              <th aria-label="corner" />
              {cols.map(col => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row}>
                <th>{row}</th>
                {cols.map(col => {
                  const hex = `${row}${col}`;
                  const glyph = glyphMap.get(hex);

                  return (
                    <td key={hex}>
                      {glyph ? (
                        <>
                          <button
                            ref={node => {
                              triggerRefs.current.set(glyph.hex, node);
                            }}
                            type="button"
                            className={`${styles.matrixLink} ${glyph.keywords.length > 0 ? styles.matrixLinkKeyword : ''}`.trim()}
                            aria-label={`Show glyph ${glyph.hex}`}
                            onMouseEnter={() => {
                              showPopover(glyph.hex);
                            }}
                            onMouseLeave={() => {
                              scheduleHide(glyph.hex);
                            }}
                            onFocus={() => {
                              showPopover(glyph.hex);
                            }}
                            onBlur={() => {
                              scheduleHide(glyph.hex);
                            }}
                            onClick={() => {
                              if (activeHex === glyph.hex) {
                                hidePopover(glyph.hex);
                                return;
                              }

                              showPopover(glyph.hex);
                            }}
                          >
                            <span className={`${styles.glyphMark} ${styles.glyphText}`}>{glyph.char}</span>
                          </button>
                          <div
                            ref={node => {
                              popoverRefs.current.set(glyph.hex, node);
                            }}
                            className={styles.glyphPopover}
                            popover="manual"
                            onMouseEnter={clearHideTimer}
                            onMouseLeave={() => {
                              scheduleHide(glyph.hex);
                            }}
                          >
                            <div className={styles.glyphPopoverMeta}>
                              <CopyPillButton
                                className={`${styles.hexPill} ${styles.copyButton}`}
                                copyId={glyph.hex}
                                copyValue={`0x${glyph.hex}`}
                                text={`0x${glyph.hex}`}
                                onCopy={copyText}
                              />
                              <CopyPillButton
                                className={`${styles.binaryPill} ${styles.copyButton}`}
                                copyId={glyph.hex}
                                copyValue={`0b${glyph.binary}`}
                                text={`0b${glyph.binary}`}
                                onCopy={copyText}
                              />
                            </div>
                            {glyph.keywords.length > 0 ? (
                              <div className={styles.glyphPopoverKeywords}>
                                {glyph.keywords.map(keyword => (
                                  <CopyPillButton
                                    key={keyword}
                                    className={`${styles.keywordPill} ${styles.copyButton}`}
                                    copyId={glyph.hex}
                                    copyValue={keyword}
                                    text={keyword}
                                    onCopy={copyText}
                                  />
                                ))}
                              </div>
                            ) : null}
                            {glyph.comment ? <div className={styles.glyphPopoverComment}>{glyph.comment}</div> : null}
                            {copiedId === glyph.hex ? (
                              <div className={styles.glyphPopoverCopyStatus} aria-live="polite">
                                Copied
                              </div>
                            ) : null}
                          </div>
                        </>
                      ) : (
                        <span className={styles.matrixEmpty}>-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GlyphMatrixClient;
