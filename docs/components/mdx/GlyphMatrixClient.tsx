'use client';

import type { FC } from 'react';
import { useMemo } from 'react';

import { hexToBinary } from '@/lib/alev-shared';

import alevTextStyles from './AlevText.module.css';
import AlevGlyphTrigger from './AlevGlyphTrigger';
import type { RenderableGlyphRecord } from './glyph-record';
import styles from './Glyphs.module.css';

type GlyphMatrixPanelProps = {
  rows: string[];
  cols: string[];
  glyphs: RenderableGlyphRecord[];
};

const GlyphMatrixClient: FC<GlyphMatrixPanelProps> = props => {
  const { rows, cols, glyphs } = props;
  const glyphMap = useMemo(
    () => new Map(glyphs.map((glyph) => [glyph.binary, glyph])),
    [glyphs],
  );

  return (
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
                const binary = hexToBinary(`${row}${col}`);
                const glyph = glyphMap.get(binary);

                if (!glyph) {
                  throw new Error(`Missing glyph record for matrix cell ${row}${col}.`);
                }

                return (
                  <td key={`${row}${col}`}>
                    <AlevGlyphTrigger
                      glyph={glyph}
                      triggerClassName={`${styles.matrixLink} ${glyph.usageCount > 0 ? styles.matrixLinkKeyword : ''}`.trim()}
                      contentClassName={`${styles.glyphMark} ${alevTextStyles.glyphText}`}
                      ariaLabel={`Show glyph ${glyph.hex}`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GlyphMatrixClient;
