"use client";

import Link from "next/link";
import { Fragment, type FC, type ReactNode } from "react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  binaryToHex,
  codepointLabelForBinary,
  glyphCharForBinary,
  normalizeAlevToken,
} from "@/lib/alev-shared";
import { useAlevClientData } from "@/lib/alev-data-context";

import alevTextStyles from "./AlevText.module.css";
import CopyPillButton, { useCopyFeedback } from "./CopyPillButton";
import styles from "./Glyphs.module.css";

type GlyphPopoverTriggerProps = {
  characterId: string;
  className: string;
  contentClassName?: string;
  ariaLabel?: string;
  pressed?: boolean;
  children?: ReactNode;
};

function renderPopoverComment(
  comment: string,
  keywordMap: Record<string, string>,
): ReactNode {
  return String(comment ?? '')
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line, lineIndex) => {
      const parts: ReactNode[] = [];
      const pattern = /:([^:\n]+):/g;
      let cursor = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(line)) !== null) {
        const [raw, inner] = match;

        if (match.index > cursor) {
          parts.push(line.slice(cursor, match.index));
        }

        const normalized = inner
          .trim()
          .split(/\s+/)
          .map((token) => normalizeAlevToken(token, keywordMap))
          .join(" ");

        parts.push(
          <span
            key={`alev-${lineIndex}-${match.index}`}
            className={alevTextStyles.glyphText}
          >
            {normalized}
          </span>,
        );

        cursor = match.index + raw.length;
      }

      if (cursor < line.length) {
        parts.push(line.slice(cursor));
      }

      if (parts.length === 0) {
        parts.push("");
      }

      return (
        <Fragment key={`line-${lineIndex}`}>
          {parts}
          {lineIndex < comment.split(/\r\n?|\n/).length - 1 ? <br /> : null}
        </Fragment>
      );
    });
}

const GlyphPopoverTrigger: FC<GlyphPopoverTriggerProps> = (props) => {
  const {
    characterId,
    className,
    contentClassName,
    ariaLabel,
    pressed,
    children,
  } = props;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const suppressNextClickRef = useRef(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const { keywordMap, lexiconMap, usageCounts } = useAlevClientData();
  const instanceId = useId();
  const { copiedId, copyText } = useCopyFeedback();
  const lexiconEntry = lexiconMap.get(characterId);
  const hex = binaryToHex(characterId);
  const codepoint = codepointLabelForBinary(characterId);
  const char = glyphCharForBinary(characterId);
  const keywords = lexiconEntry?.keywords ?? [];
  const comment = lexiconEntry?.comment ?? null;
  const usageCount = usageCounts[characterId] ?? 0;
  const hasExamples = usageCount > 0;
  const popoverId = `${instanceId}-popover`;

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearHideTimer = () => {
    if (hideTimerRef.current === null) {
      return;
    }

    window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = null;
  };

  const isFocusVisible = (element: HTMLElement) => {
    try {
      return element.matches(":focus-visible");
    } catch {
      return false;
    }
  };

  const positionPopover = () => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2,
    });
  };

  // ポップオーバーが描画された後にビューポート端からはみ出していれば位置を補正する
  useLayoutEffect(() => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!open || !trigger || !popover) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const popRect = popover.getBoundingClientRect();
    const gap = 8;
    const margin = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const halfW = popRect.width / 2;

    let adjustedLeft = position.left;
    let adjustedTop = rect.bottom + gap;

    const topWhenFlipped = rect.top - popRect.height - gap;

    if (adjustedLeft - halfW < margin) {
      adjustedLeft = halfW + margin;
    } else if (adjustedLeft + halfW > vw - margin) {
      adjustedLeft = vw - margin - halfW;
    }

    if (adjustedTop + popRect.height > vh - margin && topWhenFlipped >= margin) {
      adjustedTop = topWhenFlipped;
    } else if (adjustedTop + popRect.height > vh - margin) {
      adjustedTop = Math.max(margin, vh - margin - popRect.height);
    }

    if (adjustedTop < margin) {
      adjustedTop = margin;
    }

    if (adjustedLeft !== position.left || adjustedTop !== position.top) {
      setPosition((prev) => {
        if (prev.left === adjustedLeft && prev.top === adjustedTop) {
          return prev;
        }

        return { left: adjustedLeft, top: adjustedTop };
      });
    }
  }, [open, position.left, position.top]);

  const showPopover = () => {
    clearHideTimer();
    positionPopover();
    setOpen(true);
  };

  const hidePopover = () => {
    clearHideTimer();
    suppressNextClickRef.current = false;
    setOpen(false);
  };

  const scheduleHide = () => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      hidePopover();
    }, 90);
  };

  const copyId = `${instanceId}-${hex}`;

  const focusStaysWithinPopover = (nextFocusedNode: Node | null) => {
    if (!nextFocusedNode) {
      return false;
    }

    return (
      triggerRef.current?.contains(nextFocusedNode) === true ||
      popoverRef.current?.contains(nextFocusedNode) === true
    );
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleReposition = () => {
      positionPopover();
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }

      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }

      hidePopover();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        hidePopover();
      }
    };

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={className}
        aria-label={ariaLabel ?? `Show character ${characterId}`}
        aria-controls={open ? popoverId : undefined}
        aria-expanded={open}
        aria-pressed={pressed}
        onPointerEnter={(e) => {
          if (e.pointerType === "touch") return;
          showPopover();
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "touch") return;
          scheduleHide();
        }}
        onFocus={(event) => {
          if (!isFocusVisible(event.currentTarget)) {
            return;
          }

          suppressNextClickRef.current = true;
          showPopover();
        }}
        onBlur={(event) => {
          suppressNextClickRef.current = false;
          if (focusStaysWithinPopover(event.relatedTarget)) {
            clearHideTimer();
            return;
          }

          scheduleHide();
        }}
        onClick={() => {
          if (suppressNextClickRef.current) {
            suppressNextClickRef.current = false;
            return;
          }

          if (open) {
            hidePopover();
            return;
          }

          showPopover();
        }}
      >
        <span className={contentClassName} title={codepoint}>
          {children ?? char}
        </span>
      </button>
      {mounted && open
        ? createPortal(
            <div
              id={popoverId}
              ref={popoverRef}
              className={styles.glyphPopover}
              style={{ top: `${position.top}px`, left: `${position.left}px` }}
              onPointerEnter={(e) => {
                if (e.pointerType === "touch") return;
                clearHideTimer();
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === "touch") return;
                scheduleHide();
              }}
              onFocus={clearHideTimer}
              onBlur={(event) => {
                if (focusStaysWithinPopover(event.relatedTarget)) {
                  clearHideTimer();
                  return;
                }

                scheduleHide();
              }}
            >
              <div className={styles.glyphPopoverMeta}>
                <CopyPillButton
                  className={`${styles.hexPill} ${styles.copyButton}`}
                  copyId={`${copyId}-hex`}
                  copyValue={`0x${hex}`}
                  text={`0x${hex}`}
                  copied={copiedId === `${copyId}-hex`}
                  onCopy={copyText}
                />
                <CopyPillButton
                  className={`${styles.binaryPill} ${styles.copyButton}`}
                  copyId={`${copyId}-binary`}
                  copyValue={`0b${characterId}`}
                  text={`0b${characterId}`}
                  copied={copiedId === `${copyId}-binary`}
                  onCopy={copyText}
                />
              </div>
              {keywords.length > 0 ? (
                <div className={styles.glyphPopoverKeywords}>
                  {keywords.map((keyword) => (
                    <CopyPillButton
                      key={keyword}
                      className={`${styles.keywordPill} ${styles.copyButton}`}
                      copyId={`${copyId}-keyword-${keyword}`}
                      copyValue={keyword}
                      text={keyword}
                      copied={copiedId === `${copyId}-keyword-${keyword}`}
                      onCopy={copyText}
                    />
                  ))}
                </div>
              ) : null}
              {comment || hasExamples || usageCount >= 0 ? (
                <div className={styles.glyphPopoverFooter} aria-live="polite">
                  {usageCount >= 0 ? (
                    <span className={styles.glyphPopoverBadge}>
                      {`出現数: ${usageCount}`}
                    </span>
                  ) : null}
                  {comment ? (
                    <div className={styles.glyphPopoverComment}>
                      {renderPopoverComment(comment, keywordMap)}
                    </div>
                  ) : null}
                  {hasExamples ? (
                    <Link
                      href={`/character/${characterId}`}
                      className={styles.glyphPopoverLink}
                    >
                      全用例を見る
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
};

export default GlyphPopoverTrigger;
