'use client';

import type { FC } from 'react';

import alevTextStyles from './AlevText.module.css';
import { GlyphMetaCopyPills } from './CopyPillButton';
import { useSourceData } from './SourceDataProvider';
import styles from './Glyphs.module.css';

const GlyphListClient: FC = () => {
  const {
    glyphs,
    sourceData: { usageCounts },
  } = useSourceData();
  const visibleGlyphs = glyphs.filter((glyph) => (usageCounts[glyph.hex] ?? 0) > 0);

  return (
    <ol className={styles.list}>
      {visibleGlyphs.map(glyph => (
        <li key={glyph.hex} id={`glyph-${glyph.hex}`} className={styles.glyphRow}>
          <div className={`${styles.glyphCell} ${alevTextStyles.glyphText}`} title={glyph.codepoint}>
            {glyph.char}
          </div>
          <div className={styles.glyphDetail}>
            <GlyphMetaCopyPills
              hex={glyph.hex}
              binary={glyph.binary}
              keywords={glyph.keywords}
            />
            <div className={styles.glyphCopyStatus}>
              <span className={styles.glyphPopoverBadge}>
                {`出現数: ${usageCounts[glyph.hex] ?? 0}`}
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
