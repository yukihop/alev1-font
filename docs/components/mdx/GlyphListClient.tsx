'use client';

import type { FC } from 'react';

import alevTextStyles from './AlevText.module.css';
import CopyPillButton, { useCopyFeedback } from './CopyPillButton';
import { useSourceData } from './SourceDataProvider';
import styles from './Glyphs.module.css';

const GlyphListClient: FC = () => {
  const {
    glyphs,
    sourceData: { usageCounts },
  } = useSourceData();
  const visibleGlyphs = glyphs.filter((glyph) => (usageCounts[glyph.hex] ?? 0) > 0);
  const { copiedId, copyText } = useCopyFeedback();

  return (
    <ol className={styles.list}>
      {visibleGlyphs.map(glyph => (
        <li key={glyph.hex} id={`glyph-${glyph.hex}`} className={styles.glyphRow}>
          <div className={`${styles.glyphCell} ${alevTextStyles.glyphText}`} title={glyph.codepoint}>
            {glyph.char}
          </div>
          <div className={styles.glyphDetail}>
            <div className={styles.glyphMeta}>
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
            <div className={styles.glyphCopyStatus}>
              <span className={styles.glyphPopoverBadge}>
                {copiedId === glyph.hex ? 'Copied' : `出現数: ${usageCounts[glyph.hex] ?? 0}`}
              </span>
              {glyph.commentContent ? (
                <div className={styles.glyphComment}>{glyph.commentContent}</div>
              ) : glyph.comment ? (
                <div className={styles.glyphComment}>{glyph.comment}</div>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
};

export default GlyphListClient;
