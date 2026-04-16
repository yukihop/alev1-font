"use client";

import { useState, type FC, type ReactNode } from "react";

import glyphTriggerStyles from "./AlevGlyphTrigger.module.css";
import AlevLineClient from "./AlevLineClient";
import styles from "./CorpusView.module.css";
import type { AlevRenderableFragment } from "./alev-renderable";
import type { GlyphRenderableRecord } from "./glyph-renderable";

export type CorpusRenderableEntry = {
  type: "entry";
  position: string;
  anchor: string | null;
  japanese: string | null;
  alevLines: AlevRenderableFragment[][] | null;
  comments: Array<{
    key: string;
    content: ReactNode;
  }>;
};

export type CorpusRenderableParagraph = {
  type: "paragraph";
  content: ReactNode;
};

export type CorpusRenderableItem =
  | CorpusRenderableEntry
  | CorpusRenderableParagraph;

export type CorpusRenderableSection = {
  title: string | null;
  items: CorpusRenderableItem[];
};

type CorpusViewClientProps = {
  glyphs: GlyphRenderableRecord[];
  sections: CorpusRenderableSection[];
  usageCounts: Record<string, number>;
};

type SelectionState =
  | {
      hex: null;
      mode: "idle";
    }
  | {
      hex: string;
      mode: "highlight" | "focus";
    };

const isAbsoluteUrl = (value: string): boolean => /^https?:\/\//.test(value);

const itemContainsHex = (
  item: CorpusRenderableItem,
  selectedHex: string | null,
): boolean => {
  if (!selectedHex) {
    return false;
  }

  if (item.type === "paragraph") {
    return false;
  }

  if (item.alevLines === null) {
    return false;
  }

  return item.alevLines.some((line) =>
    line.some(
      (fragment) => fragment.type === "glyph" && fragment.hex === selectedHex,
    ),
  );
};

const CorpusViewClient: FC<CorpusViewClientProps> = (props) => {
  const { glyphs, sections, usageCounts } = props;
  const [selection, setSelection] = useState<SelectionState>({
    hex: null,
    mode: "idle",
  });
  const handleGlyphPress = (hex: string) => {
    setSelection((current) => {
      if (current.hex !== hex) {
        return { hex, mode: "highlight" };
      }

      if (current.mode === "highlight") {
        return { hex, mode: "focus" };
      }

      return { hex: null, mode: "idle" };
    });
  };

  return (
    <div className={styles.root}>
      {sections.map((section, sectionIndex) => {
        const visibleItems =
          selection.mode === "focus" && selection.hex
            ? section.items.filter((item) =>
                itemContainsHex(item, selection.hex),
              )
            : section.items;

        if (visibleItems.length === 0) {
          return null;
        }

        return (
          <section
            key={section.title ?? `section-${sectionIndex}`}
            className={styles.section}
          >
            {section.title ? (
              <h2>{section.title}</h2>
            ) : null}
            <div className={styles.entries}>
              {visibleItems.map((item, itemIndex) => {
                const itemSelected = itemContainsHex(item, selection.hex);

                if (item.type === "paragraph") {
                  return (
                    <div
                      key={`paragraph-${sectionIndex}-${itemIndex}`}
                      className={`${styles.paragraph} ${itemSelected ? styles.paragraphSelected : ""}`.trim()}
                    >
                      <div className={styles.paragraphText}>{item.content}</div>
                    </div>
                  );
                }

                return (
                  <article
                    key={`${item.position}-${itemIndex}`}
                    className={`${styles.entry} ${itemSelected ? styles.entrySelected : ""}`.trim()}
                  >
                    {item.anchor ? (
                      <a id={item.anchor} aria-hidden="true"></a>
                    ) : null}

                    <div className={styles.positionRow}>
                      {isAbsoluteUrl(item.position) ? (
                        <a href={item.position} className={styles.positionLink}>
                          {item.position}
                        </a>
                      ) : (
                        <span className={styles.position}>{item.position}</span>
                      )}
                    </div>

                    <div className={styles.textBlock}>
                      {item.japanese === null ? (
                        <p className={styles.unknown}>公式訳不明</p>
                      ) : (
                        <p className={styles.japanese}>
                          <strong>公式訳：</strong> {item.japanese}
                        </p>
                      )}
                    </div>

                    <div className={styles.textBlock}>
                      {item.alevLines === null ? (
                        <p className={styles.unknown}>公式原文不明</p>
                      ) : (
                        <AlevLineClient
                          glyphs={glyphs}
                          lines={item.alevLines}
                          usageCounts={usageCounts}
                          selectedHex={selection.hex}
                          onGlyphPress={handleGlyphPress}
                          togglePopoverOnClick={false}
                          lineKeyPrefix={`${item.position}-${itemIndex}`}
                          glyphTriggerClassName={
                            glyphTriggerStyles.inlineGlyphTrigger
                          }
                          selectedGlyphTriggerClassName={
                            glyphTriggerStyles.inlineGlyphTriggerSelected
                          }
                          glyphContentClassName={glyphTriggerStyles.inlineGlyph}
                        />
                      )}
                    </div>

                    {item.comments.length > 0 ? (
                      <div className={styles.commentBlock}>
                        {item.comments.map((comment) => (
                          <div
                            key={comment.key}
                            className={styles.comment}
                          >
                            {comment.content}
                          </div>
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
