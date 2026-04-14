'use client';

import type { FC } from 'react';

import type { GlyphRecord } from '@/lib/alev';

import CopyPillButton, { useCopyFeedback } from './CopyPillButton';
import styles from './Glyphs.module.css';

type GlyphListPanelProps = {
  glyphs: GlyphRecord[];
  usageCounts: Record<string, number>;
};

const GlyphListClient: FC<GlyphListPanelProps> = props => {
  const { glyphs, usageCounts } = props;
  const { copiedId, copyText } = useCopyFeedback();

  return (
    <div className={styles.panel}>
      <ol className={styles.list}>
        {glyphs.map(glyph => (
          <li key={glyph.hex} id={`glyph-${glyph.hex}`} className={styles.glyphRow}>
            <div className={`${styles.glyphCell} ${styles.glyphText}`} title={glyph.codepoint}>
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
                {glyph.comment ? <span className={styles.glyphComment}>{glyph.comment}</span> : null}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default GlyphListClient;
