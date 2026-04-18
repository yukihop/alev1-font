import type { FC } from 'react';
import Link from 'next/link';

import { loadLexicon, loadUsageCounts } from '@/lib/alev';

import alevTextStyles from './AlevText.module.css';
import { GlyphMetaCopyPills } from './CopyPillButton';
import InlineMdx from './InlineMdx';
import styles from './Glyphs.module.css';
import { createRenderableGlyphRecord } from './glyph-record';

const GlyphList: FC = () => {
  const lexicon = loadLexicon();
  const usageCounts = loadUsageCounts();
  const glyphs = Object.keys(usageCounts)
    .sort((left, right) => left.localeCompare(right))
    .map((binary) =>
      createRenderableGlyphRecord(
        binary,
        lexicon.get(binary),
        usageCounts[binary] ?? 0,
      ),
    );

  return (
    <ol className={styles.list}>
      {glyphs.map((glyph) => (
        <li key={glyph.hex} id={`glyph-${glyph.hex}`} className={styles.glyphRow}>
          <div
            className={`${styles.glyphCell} ${alevTextStyles.glyphText}`}
            title={glyph.codepoint}
          >
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
              <Link
                href={`/character/${glyph.binary}`}
                className={styles.glyphPopoverLink}
              >
                全用例を見る
              </Link>
            </div>
            {glyph.comment ? (
              <div className={styles.glyphComment}>
                <InlineMdx source={glyph.comment} />
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
};

export default GlyphList;
