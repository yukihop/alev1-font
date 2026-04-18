import Link from 'next/link';
import type { FC } from 'react';

import alevTextStyles from './AlevText.module.css';
import { GlyphMetaCopyPills } from './CopyPillButton';
import type { RenderableGlyphRecord } from './glyph-record';
import styles from './Glyphs.module.css';

type GlyphListClientProps = {
  glyphs: RenderableGlyphRecord[];
};

const GlyphListClient: FC<GlyphListClientProps> = ({ glyphs }) => {
  return (
    <ol className={styles.list}>
      {glyphs.map(glyph => (
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
                {`出現数: ${glyph.usageCount}`}
              </span>
              {glyph.commentContent ? (
                <div className={styles.glyphComment}>{glyph.commentContent}</div>
              ) : glyph.comment ? (
                <div className={styles.glyphComment}>{glyph.comment}</div>
              ) : null}
              <Link
                href={`/character/${glyph.binary}`}
                className={styles.glyphPopoverLink}
              >
                全用例を見る
              </Link>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
};

export default GlyphListClient;
