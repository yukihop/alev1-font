'use client';

import { useMemo, useState, type FC } from 'react';

import type { GlyphRecord } from '@/lib/alev';

import GlyphPopoverTrigger from './GlyphPopoverTrigger';
import styles from './CorpusView.module.css';

export type CorpusRenderableFragment =
  | {
      type: 'space';
      value: string;
    }
  | {
      type: 'bracket';
      value: '[' | ']';
    }
  | {
      type: 'text';
      value: string;
    }
  | {
      type: 'glyph';
      value: string;
      hex: string;
    };

export type CorpusRenderableEntry = {
  position: string;
  japanese: string | null;
  alevLines: CorpusRenderableFragment[][] | null;
  comments: CorpusRenderableCommentSegment[][];
};

export type CorpusRenderableSection = {
  title: string | null;
  entries: CorpusRenderableEntry[];
};

export type CorpusRenderableCommentSegment =
  | {
      type: 'text';
      value: string;
    }
  | {
      type: 'alev';
      fragments: CorpusRenderableFragment[];
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

const renderRenderableFragments = ({
  fragments,
  glyphMap,
  selectedHex,
  usageCounts,
  onGlyphPress,
  triggerClassName,
  contentClassName,
  keyPrefix,
}: {
  fragments: CorpusRenderableFragment[];
  glyphMap: Map<string, GlyphRecord>;
  selectedHex: string | null;
  usageCounts: Record<string, number>;
  onGlyphPress: (hex: string) => void;
  triggerClassName: string;
  contentClassName?: string;
  keyPrefix: string;
}) =>
  fragments.map((fragment, fragmentIndex) => {
    if (fragment.type === 'space' || fragment.type === 'bracket' || fragment.type === 'text') {
      return <span key={`${keyPrefix}-${fragmentIndex}`}>{fragment.value}</span>;
    }

    const glyph = glyphMap.get(fragment.hex);
    if (!glyph) {
      return <span key={`${keyPrefix}-${fragmentIndex}`}>{fragment.value}</span>;
    }

    const glyphSelected = selectedHex === fragment.hex;

    return (
      <GlyphPopoverTrigger
        key={`${keyPrefix}-${fragmentIndex}-${glyph.hex}`}
        glyph={glyph}
        className={`${triggerClassName} ${glyphSelected ? styles.inlineGlyphTriggerSelected : ''}`.trim()}
        contentClassName={contentClassName}
        ariaLabel={`Show glyph ${glyph.hex}`}
        pressed={glyphSelected}
        usageCount={usageCounts[glyph.hex] ?? 0}
        togglePopoverOnClick={false}
        onPress={() => {
          onGlyphPress(fragment.hex);
        }}
      />
    );
  });

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
                        <div className={styles.alevBlock}>
                        {entry.alevLines.map((line, lineIndex) => (
                          <div
                            key={`${entry.position}-line-${lineIndex}`}
                            className={styles.alevLine}
                          >
                            {renderRenderableFragments({
                              fragments: line,
                              glyphMap,
                              selectedHex: selection.hex,
                              usageCounts,
                              triggerClassName: styles.inlineGlyphTrigger,
                              contentClassName: styles.inlineGlyph,
                              keyPrefix: `${entry.position}-line-${lineIndex}`,
                              onGlyphPress: (hex) => {
                                setSelection((current) => {
                                  if (current.hex !== hex) {
                                    return { hex, mode: 'highlight' };
                                  }

                                  if (current.mode === 'highlight') {
                                    return { hex, mode: 'focus' };
                                  }

                                  return { hex: null, mode: 'idle' };
                                });
                              },
                            })}
                          </div>
                        ))}
                      </div>
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
                                <span key={segmentIndex} className={styles.commentAlev}>
                                  {renderRenderableFragments({
                                    fragments: segment.fragments,
                                    glyphMap,
                                    selectedHex: selection.hex,
                                    usageCounts,
                                    triggerClassName: styles.inlineGlyphTrigger,
                                    keyPrefix: `${entry.position}-comment-${commentIndex}-${segmentIndex}`,
                                    onGlyphPress: (hex) => {
                                      setSelection((current) => {
                                        if (current.hex !== hex) {
                                          return { hex, mode: 'highlight' };
                                        }

                                        if (current.mode === 'highlight') {
                                          return { hex, mode: 'focus' };
                                        }

                                        return { hex: null, mode: 'idle' };
                                      });
                                    },
                                  })}
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
