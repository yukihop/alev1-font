"use client";

import Link from "next/link";
import type { FC, ReactNode } from "react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import CopyPillButton, { useCopyFeedback } from "./CopyPillButton";
import type { RenderableGlyphRecord } from "./SourceDataProvider";
import styles from "./Glyphs.module.css";

type GlyphPopoverTriggerProps = {
  glyph: RenderableGlyphRecord;
  className: string;
  contentClassName?: string;
  ariaLabel?: string;
  pressed?: boolean;
  usageCount?: number;
  children?: ReactNode;
};

const GlyphPopoverTrigger: FC<GlyphPopoverTriggerProps> = (props) => {
  const {
    glyph,
    className,
    contentClassName,
    ariaLabel,
    pressed,
    usageCount,
    children,
  } = props;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const instanceId = useId();
  const { copiedId, copyText } = useCopyFeedback();
  const hasExamples = (usageCount ?? 0) > 0;

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
    if (!open || !popoverRef.current) {
      return;
    }

    const popover = popoverRef.current;
    const popRect = popover.getBoundingClientRect();
    const margin = 12;
    const vw = window.innerWidth;
    const halfW = popRect.width / 2;

    let adjustedLeft = position.left;

    if (adjustedLeft - halfW < margin) {
      adjustedLeft = halfW + margin;
    } else if (adjustedLeft + halfW > vw - margin) {
      adjustedLeft = vw - margin - halfW;
    }

    if (adjustedLeft !== position.left) {
      setPosition((prev) => ({ ...prev, left: adjustedLeft }));
    }
  }, [open, position.left]);

  const showPopover = () => {
    clearHideTimer();
    positionPopover();
    setOpen(true);
  };

  const hidePopover = () => {
    clearHideTimer();
    setOpen(false);
  };

  const scheduleHide = () => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      hidePopover();
    }, 90);
  };

  const copyId = `${instanceId}-${glyph.hex}`;

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
        aria-label={ariaLabel ?? `Show glyph ${glyph.hex}`}
        aria-pressed={pressed}
        onPointerEnter={(e) => {
          if (e.pointerType === "touch") return;
          showPopover();
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "touch") return;
          scheduleHide();
        }}
        onFocus={showPopover}
        onBlur={scheduleHide}
        onClick={() => {
          if (open) {
            hidePopover();
            return;
          }

          showPopover();
        }}
      >
        <span className={contentClassName}>{children ?? glyph.char}</span>
      </button>
      {mounted && open
        ? createPortal(
            <div
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
            >
              <div className={styles.glyphPopoverMeta}>
                <CopyPillButton
                  className={`${styles.hexPill} ${styles.copyButton}`}
                  copyId={`${copyId}-hex`}
                  copyValue={`0x${glyph.hex}`}
                  text={`0x${glyph.hex}`}
                  copied={copiedId === `${copyId}-hex`}
                  onCopy={copyText}
                />
                <CopyPillButton
                  className={`${styles.binaryPill} ${styles.copyButton}`}
                  copyId={`${copyId}-binary`}
                  copyValue={`0b${glyph.binary}`}
                  text={`0b${glyph.binary}`}
                  copied={copiedId === `${copyId}-binary`}
                  onCopy={copyText}
                />
              </div>
              {glyph.keywords.length > 0 ? (
                <div className={styles.glyphPopoverKeywords}>
                  {glyph.keywords.map((keyword) => (
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
              {glyph.commentContent || glyph.comment || usageCount !== undefined || hasExamples ? (
                <div className={styles.glyphPopoverFooter} aria-live="polite">
                  {usageCount !== undefined ? (
                    <span className={styles.glyphPopoverBadge}>
                      {`出現数: ${usageCount}`}
                    </span>
                  ) : null}
                  {glyph.commentContent ? (
                    <div className={styles.glyphPopoverComment}>
                      {glyph.commentContent}
                    </div>
                  ) : glyph.comment ? (
                    <div className={styles.glyphPopoverComment}>
                      {glyph.comment}
                    </div>
                  ) : null}
                  {hasExamples ? (
                    <Link
                      href={`/character/${glyph.binary}`}
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
