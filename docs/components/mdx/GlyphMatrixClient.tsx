'use client';

import type { FC } from 'react';

import alevTextStyles from './AlevText.module.css';
import AlevGlyphTrigger from './AlevGlyphTrigger';
import { useSourceData } from './SourceDataProvider';
import styles from './Glyphs.module.css';

type GlyphMatrixPanelProps = {
  rows: string[];
  cols: string[];
};

const GlyphMatrixClient: FC<GlyphMatrixPanelProps> = props => {
  const { rows, cols } = props;
  const {
    glyphMap,
    sourceData: { usageCounts },
  } = useSourceData();

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
                const hex = `${row}${col}`;
                const glyph = glyphMap.get(hex);

                return (
                  <td key={hex}>
                    {glyph ? (
                      <AlevGlyphTrigger
                        glyph={glyph}
                        usageCount={usageCounts[glyph.hex] ?? 0}
                        triggerClassName={`${styles.matrixLink} ${(usageCounts[glyph.hex] ?? 0) > 0 ? styles.matrixLinkKeyword : ''}`.trim()}
                        contentClassName={`${styles.glyphMark} ${alevTextStyles.glyphText}`}
                        ariaLabel={`Show glyph ${glyph.hex}`}
                      />
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
  );
};

export default GlyphMatrixClient;
