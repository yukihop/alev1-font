import { type FC } from "react";

import { alev } from "./data.ts";

const ConceptDictionary: FC = () => {
  return (
    <div className="component-shell">
      <ul className="dictionary-list">
        {alev.dictionaryEntries.map((entry) => (
          <li
            key={entry.keyword}
            id={`dict-${entry.keyword}`}
            className="dictionary-row"
          >
            <div className="dictionary-word">
              <a href={`#glyph-${entry.glyph.hex}`}>{entry.keyword}</a>
            </div>
            <div className="dictionary-glyph">{entry.glyph.char}</div>
            <div className="dictionary-hex">{`0x${entry.glyph.hex} / 0b${entry.glyph.binary}`}</div>
            <div className="muted">{entry.synonyms.join(", ")}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ConceptDictionary;
