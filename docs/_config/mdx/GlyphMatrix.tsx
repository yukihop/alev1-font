import { type FC } from 'react';

import { alev, glyphMap } from './data.ts';

const GlyphMatrix: FC = () => {
  return (
    <div className="component-shell">
      <div className="matrix-wrap">
        <table className="matrix">
          <thead>
            <tr>
              <th aria-label="corner" />
              {alev.cols.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alev.rows.map((row) => (
              <tr key={row}>
                <th>{row}</th>
                {alev.cols.map((col) => {
                  const hex = `${row}${col}`;
                  const glyph = glyphMap.get(hex);

                  return (
                    <td key={hex}>
                      {glyph ? (
                        <a
                          className={`matrix-link${glyph.keywords.length > 0 ? ' matrix-link--keyword' : ''}`}
                          href={`#glyph-${glyph.hex}`}
                          aria-label={`Jump to glyph ${glyph.hex}`}
                        >
                          <span className="glyph-mark">{glyph.char}</span>
                        </a>
                      ) : (
                        <span className="matrix-empty">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GlyphMatrix;
