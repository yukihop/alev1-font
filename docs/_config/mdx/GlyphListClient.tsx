import { type FC } from 'react';

import CopyPillButton, { useCopyFeedback } from './CopyPill.tsx';
import { type GlyphRecord } from '../alev.ts';

export type GlyphListProps = {
  glyphs: GlyphRecord[];
};

const GlyphListClient: FC<GlyphListProps> = props => {
  const { glyphs } = props;
  const { copiedId, copyText } = useCopyFeedback();

  return (
    <div className="component-shell">
      <ol className="glyph-list">
        {glyphs.map(glyph => (
          <li key={glyph.hex} id={`glyph-${glyph.hex}`} className="glyph-row">
            <div className="glyph-cell" title={glyph.codepoint}>
              {glyph.char}
            </div>
            <div className="glyph-detail">
              <GlyphMetaButtons glyph={glyph} onCopy={copyText} />
              {glyph.comment ? <div className="glyph-comment">{glyph.comment}</div> : null}
              {copiedId === glyph.hex ? <div className="glyph-copy-status">Copied</div> : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

function GlyphMetaButtons(props: { glyph: GlyphRecord; onCopy: (copyId: string, copyValue: string) => void }) {
  const { glyph, onCopy } = props;

  return (
    <div className="glyph-meta">
      <CopyPillButton
        className="hex-pill glyph-inline-copy"
        copyId={glyph.hex}
        copyValue={`0x${glyph.hex}`}
        text={`0x${glyph.hex}`}
        onCopy={onCopy}
      />
      <CopyPillButton
        className="binary-pill glyph-inline-copy"
        copyId={glyph.hex}
        copyValue={`0b${glyph.binary}`}
        text={`0b${glyph.binary}`}
        onCopy={onCopy}
      />
      {glyph.keywords.map(keyword => (
        <CopyPillButton
          key={keyword}
          className="keyword-pill glyph-inline-copy"
          copyId={glyph.hex}
          copyValue={keyword}
          text={keyword}
          onCopy={onCopy}
        />
      ))}
    </div>
  );
}

export default GlyphListClient;
