"use client";

import { useMemo, useState, type FC } from "react";

import type { GlyphRecord } from "@/lib/alev";

import alevTextStyles from "./AlevText.module.css";
import glyphTriggerStyles from "./AlevGlyphTrigger.module.css";
import AlevRenderableFragments from "./AlevRenderableFragments";
import AlevLineClient from "./AlevLineClient";
import styles from "./CorpusView.module.css";
import type {
  AlevRenderableCommentSegment,
  AlevRenderableFragment,
} from "./alev-renderable";

export type CorpusRenderableEntry = {
  type: "entry";
  position: string;
  japanese: string | null;
  alevLines: AlevRenderableFragment[][] | null;
  comments: AlevRenderableCommentSegment[][];
};

export type CorpusRenderableParagraph = {
  type: "paragraph";
  content: AlevRenderableCommentSegment[];
};

export type CorpusRenderableItem =
  | CorpusRenderableEntry
  | CorpusRenderableParagraph;

export type CorpusRenderableSection = {
  title: string | null;
  items: CorpusRenderableItem[];
};

type CorpusViewClientProps = {
  glyphs: GlyphRecord[];
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

const commentContainsHex = (
  comment: AlevRenderableCommentSegment[],
  selectedHex: string | null,
): boolean => {
  if (!selectedHex) {
    return false;
  }

  return comment.some(
    (segment) =>
      segment.type === "alev" &&
      segment.fragments.some(
        (fragment) => fragment.type === "glyph" && fragment.hex === selectedHex,
      ),
  );
};

const itemContainsHex = (
  item: CorpusRenderableItem,
  selectedHex: string | null,
): boolean => {
  if (!selectedHex) {
    return false;
  }

  if (item.type === "paragraph") {
    return commentContainsHex(item.content, selectedHex);
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

type RenderCommentProps = {
  comment: AlevRenderableCommentSegment[];
  glyphMap: Map<string, GlyphRecord>;
  usageCounts: Record<string, number>;
  selectedHex: string | null;
  onGlyphPress: (hex: string) => void;
  keyPrefix: string;
  className: string;
  alevClassName?: string;
};

const RenderComment: FC<RenderCommentProps> = ({
  comment,
  glyphMap,
  usageCounts,
  selectedHex,
  onGlyphPress,
  keyPrefix,
  className,
  alevClassName,
}) => (
  <p className={className}>
    {comment.map((segment, segmentIndex) => {
      if (segment.type === "text") {
        return <span key={segmentIndex}>{segment.value}</span>;
      }

      return (
        <span
          key={segmentIndex}
          className={`${alevClassName ?? ""} ${alevTextStyles.glyphText}`.trim()}
        >
          <AlevRenderableFragments
            fragments={segment.fragments}
            glyphMap={glyphMap}
            selectedHex={selectedHex}
            usageCounts={usageCounts}
            onGlyphPress={onGlyphPress}
            togglePopoverOnClick={false}
            triggerClassName={glyphTriggerStyles.inlineGlyphTrigger}
            keyPrefix={`${keyPrefix}-${segmentIndex}`}
            selectedTriggerClassName={
              glyphTriggerStyles.inlineGlyphTriggerSelected
            }
            contentClassName={glyphTriggerStyles.inlineGlyph}
          />
        </span>
      );
    })}
  </p>
);

const CorpusViewClient: FC<CorpusViewClientProps> = (props) => {
  const { glyphs, sections, usageCounts } = props;
  const [selection, setSelection] = useState<SelectionState>({
    hex: null,
    mode: "idle",
  });
  const glyphMap = useMemo(
    () => new Map(glyphs.map((glyph) => [glyph.hex, glyph])),
    [glyphs],
  );
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
                    <RenderComment
                      key={`paragraph-${sectionIndex}-${itemIndex}`}
                      comment={item.content}
                      glyphMap={glyphMap}
                      usageCounts={usageCounts}
                      selectedHex={selection.hex}
                      onGlyphPress={handleGlyphPress}
                      keyPrefix={`paragraph-${sectionIndex}-${itemIndex}`}
                      className={`${styles.paragraph} ${itemSelected ? styles.paragraphSelected : ""}`.trim()}
                      alevClassName={styles.paragraphAlev}
                    />
                  );
                }

                return (
                  <article
                    key={`${item.position}-${itemIndex}`}
                    className={`${styles.entry} ${itemSelected ? styles.entrySelected : ""}`.trim()}
                  >
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
                          className={styles.alevBlock}
                          lineClassName={styles.alevLine}
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
                        {item.comments.map((comment, commentIndex) => (
                          <RenderComment
                            key={`${item.position}-comment-${commentIndex}`}
                            comment={comment}
                            glyphMap={glyphMap}
                            usageCounts={usageCounts}
                            selectedHex={selection.hex}
                            onGlyphPress={handleGlyphPress}
                            keyPrefix={`${item.position}-comment-${commentIndex}`}
                            className={styles.comment}
                            alevClassName={styles.commentAlev}
                          />
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
