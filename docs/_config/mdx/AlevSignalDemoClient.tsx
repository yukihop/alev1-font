import { type FC, useEffect, useState } from 'react';

import { type GlyphRecord } from '../alev.ts';

export type AlevSignalDemoProps = {
  glyphs: GlyphRecord[];
};

type Slot = {
  hex: string;
  char: string;
  featured: boolean;
};

const SLOT_COUNT = 42;

const AlevSignalDemoClient: FC<AlevSignalDemoProps> = props => {
  const { glyphs } = props;
  const [slots, setSlots] = useState(() => createInitialSlots(glyphs));
  const [focusHex, setFocusHex] = useState(() => pickGlyph(glyphs).hex);
  const [glitchPhase, setGlitchPhase] = useState(false);

  useEffect(() => {
    setSlots(createInitialSlots(glyphs));
    setFocusHex(pickGlyph(glyphs).hex);
  }, [glyphs]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSlots(current => {
        const next = current.slice();
        const updates = 3 + Math.floor(Math.random() * 6);

        for (let index = 0; index < updates; index += 1) {
          const slotIndex = Math.floor(Math.random() * next.length);
          next[slotIndex] = createSlot(glyphs);
        }

        return next;
      });

      setFocusHex(pickGlyph(glyphs).hex);
      setGlitchPhase(current => !current);
    }, 85);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [glyphs]);

  return (
    <div className={`component-shell alev-signal-demo${glitchPhase ? ' is-glitch' : ''}`}>
      <div className="alev-signal-demo-frame">
        <div className="alev-signal-demo-grid" aria-hidden="true">
          {slots.map((slot, index) => (
            <span
              key={`${index}-${slot.hex}`}
              className={`alev-signal-demo-cell${slot.featured ? ' is-featured' : ''}${slot.hex === focusHex ? ' is-focus' : ''}`}
            >
              {slot.char}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

function createInitialSlots(glyphs: GlyphRecord[]): Slot[] {
  return Array.from({ length: SLOT_COUNT }, () => createSlot(glyphs));
}

function createSlot(glyphs: GlyphRecord[]): Slot {
  const glyph = pickGlyph(glyphs);
  return {
    hex: glyph.hex,
    char: glyph.char,
    featured: glyph.keywords.length > 0,
  };
}

function pickGlyph(glyphs: GlyphRecord[]): GlyphRecord {
  const featuredGlyphs = glyphs.filter(glyph => glyph.keywords.length > 0);
  const pool = featuredGlyphs.length > 0 && Math.random() < 0.45 ? featuredGlyphs : glyphs;
  return pool[Math.floor(Math.random() * pool.length)] ?? glyphs[0];
}

export default AlevSignalDemoClient;
