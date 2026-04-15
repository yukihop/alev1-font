'use client';

import type { FC } from 'react';
import { useEffect, useState } from 'react';

import type { GlyphRecord } from '@/lib/alev';

import alevTextStyles from './AlevText.module.css';
import styles from './AlevSignalDemo.module.css';

type AlevSignalDemoPanelProps = {
  glyphs: GlyphRecord[];
};

type Slot = {
  hex: string;
  char: string;
  featured: boolean;
};

const slotCount = 42;

const createInitialSlots = (glyphs: GlyphRecord[]): Slot[] =>
  Array.from({ length: slotCount }, () => createSlot(glyphs));

const createSlot = (glyphs: GlyphRecord[]): Slot => {
  const glyph = pickGlyph(glyphs);
  return {
    hex: glyph.hex,
    char: glyph.char,
    featured: glyph.keywords.length > 0,
  };
};

const pickGlyph = (glyphs: GlyphRecord[]): GlyphRecord => {
  const featuredGlyphs = glyphs.filter(glyph => glyph.keywords.length > 0);
  const pool = featuredGlyphs.length > 0 && Math.random() < 0.45 ? featuredGlyphs : glyphs;
  return pool[Math.floor(Math.random() * pool.length)] ?? glyphs[0];
};

const AlevSignalDemoClient: FC<AlevSignalDemoPanelProps> = props => {
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
    <div className={`${styles.panel} ${glitchPhase ? styles.glitch : ''}`.trim()}>
      <div className={styles.frame}>
        <div className={styles.grid} aria-hidden="true">
          {slots.map((slot, index) => (
            <span
              key={`${index}-${slot.hex}`}
              className={`${styles.cell} ${alevTextStyles.glyphText} ${slot.featured ? styles.featured : ''} ${slot.hex === focusHex ? styles.focus : ''}`.trim()}
            >
              {slot.char}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlevSignalDemoClient;
