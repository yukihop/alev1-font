'use client';

import { useMemo, useState, type FC } from 'react';

import type { GlyphRecord } from '@/lib/alev';

import alevTextStyles from './AlevText.module.css';
import glyphTriggerStyles from './AlevGlyphTrigger.module.css';
import AlevRenderableFragments from './AlevRenderableFragments';
import AlevLineClient from './AlevLineClient';
import styles from './CorpusView.module.css';
import type { AlevRenderableCommentSegment, AlevRenderableFragment } from './alev-renderable';

export type CorpusRenderableEntry = {
  position: string;
  japanese: string | null;
  alevLines: AlevRenderableFragment[][] | null;
  comments: AlevRenderableCommentSegment[][];
};

export type CorpusRenderableSection = {
  title: string | null;
  entries: CorpusRenderableEntry[];
};

type CorpusViewClientProps = {
  glyphs: GlyphRecord[];
  sections: CorpusRenderableSection[];
  usageCounts: Record<string, number>;
};

type SelectionState =
  | {
      hex: null;
      mode: 'idle';
    }
  | {
      hex: string;
      mode: 'highlight' | 'focus';
    };

const isAbsoluteUrl = (value: string): boolean => /^https?:\/\//.test(value);

const entryContainsHex = (
  entry: CorpusRenderableEntry,
  selectedHex: string | null,
): boolean => {
  if (!selectedHex || entry.alevLines === null) {
    return false;
  }

  return entry.alevLines.some((line) =>
    line.some((fragment) => fragment.type === 'glyph' && fragment.hex === selectedHex),
  );
};

const CorpusViewClient: FC<CorpusViewClientProps> = (props) => {
  const { glyphs, sections, usageCounts } = props;
  const [selection, setSelection] = useState<SelectionState>({
    hex: null,
    mode: 'idle',
  });
  const glyphMap = useMemo(
    () => new Map(glyphs.map((glyph) => [glyph.hex, glyph])),
    [glyphs],
  );
  const handleGlyphPress = (hex: string) => {
    setSelection((current) => {
      if (current.hex !== hex) {
        return { hex, mode: 'highlight' };
      }

      if (current.mode === 'highlight') {
        return { hex, mode: 'focus' };
      }

      return { hex: null, mode: 'idle' };
    });
  };

  return (
    <div className={styles.root}>
      {sections.map((section, sectionIndex) => {
        const visibleEntries =
          selection.mode === 'focus' && selection.hex
            ? section.entries.filter((entry) => entryContainsHex(entry, selection.hex))
            : section.entries;

        if (visibleEntries.length === 0) {
          return null;
        }

        return (
          <section
            key={section.title ?? `section-${sectionIndex}`}
            className={styles.section}
          >
            {section.title ? (
              <h2 className={styles.sectionTitle}>{section.title}</h2>
            ) : null}
            <div className={styles.entries}>
              {visibleEntries.map((entry, entryIndex) => {
                const entrySelected = entryContainsHex(entry, selection.hex);

                return (
                  <article
                    key={`${entry.position}-${entryIndex}`}
                    className={`${styles.entry} ${entrySelected ? styles.entrySelected : ''}`.trim()}
                  >
                    <div className={styles.positionRow}>
                      {isAbsoluteUrl(entry.position) ? (
                        <a href={entry.position} className={styles.positionLink}>
                          {entry.position}
                        </a>
                      ) : (
                        <span className={styles.position}>{entry.position}</span>
                      )}
                    </div>

                    <div className={styles.textBlock}>
                      {entry.japanese === null ? (
                        <p className={styles.unknown}>公式訳不明</p>
                      ) : (
                        <p className={styles.japanese}>{entry.japanese}</p>
                      )}
                    </div>

                    <div className={styles.textBlock}>
                      {entry.alevLines === null ? (
                        <p className={styles.unknown}>公式原文不明</p>
                      ) : (
                        <AlevLineClient
                          glyphs={glyphs}
                          lines={entry.alevLines}
                          usageCounts={usageCounts}
                          selectedHex={selection.hex}
                          onGlyphPress={handleGlyphPress}
                          togglePopoverOnClick={false}
                          className={styles.alevBlock}
                          lineClassName={styles.alevLine}
                          lineKeyPrefix={`${entry.position}-${entryIndex}`}
                          glyphTriggerClassName={glyphTriggerStyles.inlineGlyphTrigger}
                          selectedGlyphTriggerClassName={glyphTriggerStyles.inlineGlyphTriggerSelected}
                          glyphContentClassName={glyphTriggerStyles.inlineGlyph}
                        />
                      )}
                    </div>

                    {entry.comments.length > 0 ? (
                      <div className={styles.commentBlock}>
                        {entry.comments.map((comment, commentIndex) => (
                          <p
                            key={`${entry.position}-comment-${commentIndex}`}
                            className={styles.comment}
                          >
                            {comment.map((segment, segmentIndex) => {
                              if (segment.type === 'text') {
                                return <span key={segmentIndex}>{segment.value}</span>;
                              }

                              return (
                                <span key={segmentIndex} className={`${styles.commentAlev} ${alevTextStyles.glyphText}`}>
                                  <AlevRenderableFragments
                                    fragments={segment.fragments}
                                    glyphMap={glyphMap}
                                    selectedHex={selection.hex}
                                    usageCounts={usageCounts}
                                    onGlyphPress={handleGlyphPress}
                                    togglePopoverOnClick={false}
                                    triggerClassName={glyphTriggerStyles.inlineGlyphTrigger}
                                    keyPrefix={`${entry.position}-comment-${commentIndex}-${segmentIndex}`}
                                    selectedTriggerClassName={glyphTriggerStyles.inlineGlyphTriggerSelected}
                                    contentClassName={glyphTriggerStyles.inlineGlyph}
                                  />
                                </span>
                              );
                            })}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default CorpusViewClient;
