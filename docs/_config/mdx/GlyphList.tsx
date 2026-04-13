import { type FC } from "react";
import { alev } from "./data.ts";

const GlyphList: FC = () => {
  return (
    <div className="component-shell">
      <ol className="glyph-list">
        {alev.glyphs.map((glyph) => (
          <li key={glyph.hex} id={`glyph-${glyph.hex}`} className="glyph-row">
            <div className="glyph-cell" title={glyph.codepoint}>
              {glyph.char}
            </div>
            <div className="glyph-detail">
              <div className="glyph-meta">
                <span className="hex-pill">{`0x${glyph.hex}`}</span>
                <span className="binary-pill">{`0b${glyph.binary}`}</span>
                {glyph.keywords.map((keyword) => (
                  <span key={keyword} className="keyword-pill">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default GlyphList;
