import type { FC, ReactNode } from "react";

import glyphTriggerStyles from "./AlevGlyphTrigger.module.css";
import AlevLineClient from "./AlevLineClient";
import styles from "./CorpusView.module.css";
import type { AlevRenderableFragment } from "./alev-renderable";

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
  sections: CorpusRenderableSection[];
  selectedHex?: string | null;
};

const isAbsoluteUrl = (value: string): boolean => /^https?:\/\//.test(value);

const CorpusViewClient: FC<CorpusViewClientProps> = (props) => {
  const { sections, selectedHex = null } = props;

  return (
    <div className={styles.root}>
      {sections.map((section, sectionIndex) => {
        return (
          <section
            key={section.title ?? `section-${sectionIndex}`}
            className={styles.section}
          >
            {section.title ? (
              <h2>{section.title}</h2>
            ) : null}
            <div className={styles.entries}>
              {section.items.map((item, itemIndex) => {
                if (item.type === "paragraph") {
                  return (
                    <div
                      key={`paragraph-${sectionIndex}-${itemIndex}`}
                      className={styles.paragraph}
                    >
                      <div className={styles.paragraphText}>{item.content}</div>
                    </div>
                  );
                }

                return (
                  <article
                    key={`${item.position}-${itemIndex}`}
                    className={styles.entry}
                  >
                    {item.anchor ? (
                      <a id={item.anchor} aria-hidden="true"></a>
                    ) : null}

                    <div className={styles.bodyBlock}>
                      <div className={styles.positionRow}>
                        {isAbsoluteUrl(item.position) ? (
                          <a href={item.position} className={styles.positionLink}>
                            {item.position}
                          </a>
                        ) : (
                          <span className={styles.position}>{item.position}</span>
                        )}
                      </div>

                      {item.japanese === null ? (
                        <p className={styles.unknown}>公式訳不明</p>
                      ) : (
                        <p className={styles.japanese}>
                          <strong>公式訳：</strong> {item.japanese}
                        </p>
                      )}

                      {item.alevLines === null ? (
                        <p className={styles.unknown}>公式原文不明</p>
                      ) : (
                        <div className={styles.exampleBlock}>
                          <AlevLineClient
                            lines={item.alevLines}
                            selectedHex={selectedHex}
                            lineKeyPrefix={`${item.position}-${itemIndex}`}
                            glyphTriggerClassName={
                              glyphTriggerStyles.inlineGlyphTrigger
                            }
                            selectedGlyphTriggerClassName={
                              glyphTriggerStyles.inlineGlyphTriggerSelected
                            }
                            glyphContentClassName={glyphTriggerStyles.inlineGlyph}
                          />
                        </div>
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
