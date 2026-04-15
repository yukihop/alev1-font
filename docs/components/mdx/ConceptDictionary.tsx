import type { FC } from 'react';

import { getAlevData } from '@/lib/alev';

import alevTextStyles from './AlevText.module.css';
import styles from './Glyphs.module.css';

const ConceptDictionary: FC = () => {
  const { dictionaryEntries } = getAlevData();

  return (
    <div className={styles.panel}>
      <ul className={styles.dictionaryList}>
        {dictionaryEntries.map((entry) => (
          <li key={entry.keyword} id={`dict-${entry.keyword}`} className={styles.dictionaryRow}>
            <div className={styles.dictionaryWord}>
              <a href={`#glyph-${entry.glyph.hex}`}>{entry.keyword}</a>
            </div>
            <div className={`${styles.dictionaryGlyph} ${alevTextStyles.glyphText}`}>{entry.glyph.char}</div>
            <div className={styles.dictionaryHex}>{`0x${entry.glyph.hex} / 0b${entry.glyph.binary}`}</div>
            <div className={styles.muted}>{entry.synonyms.join(', ')}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ConceptDictionary;
