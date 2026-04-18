'use client';

import type { FC } from 'react';

import { hexToBinary } from '@/lib/alev-shared';
import { useAlevClientData } from '@/lib/alev-data-context';

import alevTextStyles from './AlevText.module.css';
import AlevGlyphTrigger from './AlevGlyphTrigger';
import styles from './Glyphs.module.css';

type GlyphMatrixPanelProps = {
  rows: string[];
  cols: string[];
};

const GlyphMatrixClient: FC<GlyphMatrixPanelProps> = props => {
  const { rows, cols } = props;
  const { usageCounts } = useAlevClientData();

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
                const characterId = hexToBinary(`${row}${col}`);

                return (
                  <td key={`${row}${col}`}>
                    <AlevGlyphTrigger
                      characterId={characterId}
                      triggerClassName={`${styles.matrixLink} ${usageCounts[characterId] > 0 ? styles.matrixLinkKeyword : ''}`.trim()}
                      contentClassName={`${styles.glyphMark} ${alevTextStyles.glyphText}`}
                      ariaLabel={`Show character ${characterId}`}
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
