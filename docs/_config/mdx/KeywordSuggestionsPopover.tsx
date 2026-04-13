import {
  type CSSProperties,
  type FC,
  type KeyboardEvent,
  type RefObject,
  useRef,
  useState,
} from "react";

import {
  getKeywordSuggestions,
  normalizeEditorContent,
  type KeywordMap,
} from "./simpleEditorShared.ts";

// ─── Caret position utility ───────────────────────────────────────────────────

const CARET_STYLE_PROPS = [
  "boxSizing",
  "borderLeftWidth",
  "borderRightWidth",
  "borderTopWidth",
  "borderBottomWidth",
  "direction",
  "fontFamily",
  "fontFeatureSettings",
  "fontKerning",
  "fontSize",
  "fontStretch",
  "fontStyle",
  "fontVariant",
  "fontVariantLigatures",
  "fontWeight",
  "letterSpacing",
  "lineHeight",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "textAlign",
  "tabSize",
  "textIndent",
  "textTransform",
  "whiteSpace",
  "width",
  "wordBreak",
  "wordSpacing",
  "overflowWrap",
] as const;

function getTextareaCaretPosition(
  textarea: HTMLTextAreaElement,
  selectionStart: number,
) {
  const computed = window.getComputedStyle(textarea);
  const mirror = document.createElement("div");
  const marker = document.createElement("span");
  const before = textarea.value
    .slice(0, selectionStart)
    .replace(/\n$/, "\n\u200b");
  const after = textarea.value.slice(selectionStart);

  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.top = "0";
  mirror.style.left = "0";
  mirror.style.pointerEvents = "none";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordBreak = "break-word";
  mirror.style.overflowWrap = "break-word";

  for (const property of CARET_STYLE_PROPS) {
    mirror.style[property] = computed[property];
  }

  mirror.textContent = before;
  marker.textContent = after[0] || "\u200b";
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const borderLeft = Number.parseFloat(computed.borderLeftWidth) || 0;
  const borderTop = Number.parseFloat(computed.borderTopWidth) || 0;
  const left = marker.offsetLeft + borderLeft - textarea.scrollLeft;
  const top = marker.offsetTop + borderTop - textarea.scrollTop;
  const height =
    marker.offsetHeight || Number.parseFloat(computed.lineHeight) || 16;

  document.body.removeChild(mirror);

  return { left, top, height };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export type UseSuggestionsOptions = {
  /** テキスト全体とキャレット位置からサジェスト対象のプレフィックスを返す */
  getPrefix: (value: string, selectionStart: number) => string;
  /** サジェストを適用した新しい値とキャレット位置を返す */
  applyToValue: (
    value: string,
    selectionStart: number,
    selectionEnd: number,
    suggestion: string,
  ) => { nextValue: string; nextCaret: number };
  /** 新しい値を親に伝える */
  onApply: (nextValue: string) => void;
};

export function useKeywordSuggestions(
  inputRef: RefObject<HTMLTextAreaElement | null>,
  keywordList: string[],
  { getPrefix, applyToValue, onApply }: UseSuggestionsOptions,
) {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [popoverPosition, setPopoverPosition] = useState({
    left: 20,
    top: 132,
  });

  const syncPopover = (nextSuggestions: string[]) => {
    const popover = popoverRef.current;
    if (!popover) return;
    if (nextSuggestions.length > 0 && !popover.matches(":popover-open")) {
      popover.showPopover();
    } else if (
      nextSuggestions.length === 0 &&
      popover.matches(":popover-open")
    ) {
      popover.hidePopover();
    }
  };

  const updatePopoverPosition = (selectionStart: number) => {
    const input = inputRef.current;
    if (!input) return;
    const caret = getTextareaCaretPosition(input, selectionStart);
    const inputRect = input.getBoundingClientRect();
    const left = Math.max(
      12,
      Math.min(inputRect.left + caret.left, window.innerWidth - 220),
    );
    const top = inputRect.top + caret.top + caret.height + 8;
    setPopoverPosition({ left, top });
  };

  const updateSuggestions = (value: string, selectionStart: number) => {
    const nextSuggestions = getKeywordSuggestions(
      getPrefix(value, selectionStart),
      keywordList,
    );
    setSuggestions(nextSuggestions);
    setActiveSuggestionIndex((current) =>
      Math.min(current, Math.max(nextSuggestions.length - 1, 0)),
    );
    updatePopoverPosition(selectionStart);
    syncPopover(nextSuggestions);
  };

  const hideSuggestions = () => {
    setSuggestions([]);
    setActiveSuggestionIndex(0);
    syncPopover([]);
  };

  const syncFromInput = () => {
    const input = inputRef.current;
    if (!input) return;
    updateSuggestions(input.value, input.selectionStart ?? input.value.length);
  };

  const applySuggestion = (suggestion: string) => {
    const input = inputRef.current;
    if (!input) return;
    const selectionStart = input.selectionStart ?? input.value.length;
    const selectionEnd = input.selectionEnd ?? selectionStart;
    const { nextValue, nextCaret } = applyToValue(
      input.value,
      selectionStart,
      selectionEnd,
      suggestion,
    );
    onApply(nextValue);
    hideSuggestions();
    requestAnimationFrame(() => {
      const target = inputRef.current;
      if (!target) return;
      target.focus();
      target.setSelectionRange(nextCaret, nextCaret);
    });
  };

  const onChangeHandler = (value: string, selectionStart: number) => {
    updateSuggestions(value, selectionStart);
  };

  const onKeyDownHandler = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestionIndex((current) => (current + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestionIndex(
        (current) => (current - 1 + suggestions.length) % suggestions.length,
      );
      return;
    }

    if (
      (event.key === "Enter" || event.key === "Tab") &&
      suggestions[activeSuggestionIndex]
    ) {
      event.preventDefault();
      applySuggestion(suggestions[activeSuggestionIndex]);
      return;
    }

    if (event.key === "Escape") {
      hideSuggestions();
    }
  };

  return {
    popoverRef,
    suggestions,
    activeSuggestionIndex,
    popoverPosition,
    syncFromInput,
    hideSuggestions,
    applySuggestion,
    onChangeHandler,
    onKeyDownHandler,
  };
}

// ─── Popover component ────────────────────────────────────────────────────────

type KeywordSuggestionsPopoverProps = {
  popoverRef: RefObject<HTMLDivElement | null>;
  suggestions: string[];
  activeSuggestionIndex: number;
  popoverPosition: { left: number; top: number };
  applySuggestion: (suggestion: string) => void;
  keywordMap: KeywordMap;
};

export const KeywordSuggestionsPopover: FC<KeywordSuggestionsPopoverProps> = ({
  popoverRef,
  suggestions,
  activeSuggestionIndex,
  popoverPosition,
  applySuggestion,
  keywordMap,
}) => (
  <div
    ref={popoverRef}
    className="simple-editor-popover"
    // @ts-expect-error -- popover は標準 HTML 属性だが React の型定義がまだ含んでいない
    popover="manual"
    aria-label="Keyword suggestions"
    style={
      {
        left: `${popoverPosition.left}px`,
        top: `${popoverPosition.top}px`,
      } as CSSProperties
    }
  >
    <div className="simple-editor-suggestions">
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion}
          type="button"
          className={`simple-editor-suggestion${index === activeSuggestionIndex ? " is-active" : ""}`}
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onClick={() => {
            applySuggestion(suggestion);
          }}
        >
          <span className="simple-editor-suggestion-word">{suggestion}</span>
          <span className="simple-editor-suggestion-glyph" aria-hidden="true">
            {normalizeEditorContent(suggestion, keywordMap)}
          </span>
        </button>
      ))}
    </div>
  </div>
);
