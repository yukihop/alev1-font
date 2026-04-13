import { type CSSProperties, type FC, useId, useRef, useState } from 'react';

import {
  applySuggestionToValue,
  DEFAULT_EDITOR_VALUE,
  DEFAULT_FONT_SIZE,
  DEFAULT_LETTER_SPACING,
  defaultVisualPreset,
  getActiveTokenPrefix,
  getKeywordList,
  getKeywordSuggestions,
  normalizeEditorContent,
  type KeywordMap,
  type SimpleEditorProps,
  type VisualPreset,
  visualPresets,
} from './simpleEditorShared.ts';

const SimpleEditorClient: FC<SimpleEditorProps> = props => {
  const {
    defaultValue = DEFAULT_EDITOR_VALUE,
    defaultFontSize = DEFAULT_FONT_SIZE,
    defaultLetterSpacing = DEFAULT_LETTER_SPACING,
    keywordMap,
  } = props;
  const inputId = useId();
  const fontSizeId = useId();
  const letterSpacingId = useId();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const keywordList = getKeywordList(keywordMap);
  const [inputValue, setInputValue] = useState(defaultValue);
  const [fontSize, setFontSize] = useState(defaultFontSize);
  const [letterSpacing, setLetterSpacing] = useState(defaultLetterSpacing);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [selectedPresetValue, setSelectedPresetValue] = useState(defaultVisualPreset.value);
  const [popoverPosition, setPopoverPosition] = useState({ left: 20, top: 132 });
  const selectedPreset = visualPresets.find(preset => preset.value === selectedPresetValue) ?? defaultVisualPreset;
  const previewStyle = {
    '--simple-editor-font-size': `${fontSize}px`,
    '--simple-editor-letter-spacing': `${letterSpacing}em`,
    '--simple-editor-drop-shadow': selectedPreset.shadow,
  } as CSSProperties;
  const frameStyle = {
    '--simple-editor-preview-background': selectedPreset.background,
    '--simple-editor-preview-color': selectedPreset.color,
  } as CSSProperties;

  const syncPopover = (nextSuggestions: string[]) => {
    const popover = popoverRef.current;
    if (!popover) {
      return;
    }

    if (nextSuggestions.length > 0 && !popover.matches(':popover-open')) {
      popover.showPopover();
      return;
    }

    if (nextSuggestions.length === 0 && popover.matches(':popover-open')) {
      popover.hidePopover();
    }
  };

  const updateSuggestions = (value: string, selectionStart: number) => {
    const nextSuggestions = getKeywordSuggestions(
      getActiveTokenPrefix(value, selectionStart),
      keywordList,
    );

    setSuggestions(nextSuggestions);
    setActiveSuggestionIndex(current => Math.min(current, Math.max(nextSuggestions.length - 1, 0)));
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
    if (!input) {
      return;
    }

    updateSuggestions(input.value, input.selectionStart ?? input.value.length);
  };

  const updatePopoverPosition = (selectionStart: number) => {
    const input = inputRef.current;
    const root = rootRef.current;
    if (!input || !root) {
      return;
    }

    const caret = getTextareaCaretPosition(input, selectionStart);
    const inputRect = input.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const left = Math.max(12, Math.min(
      inputRect.left - rootRect.left + caret.left,
      rootRect.width - 220,
    ));
    const top = inputRect.top - rootRect.top + caret.top + caret.height + 8;

    setPopoverPosition({
      left,
      top,
    });
  };

  const applySuggestion = (suggestion: string) => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    const selectionStart = input.selectionStart ?? input.value.length;
    const selectionEnd = input.selectionEnd ?? selectionStart;
    const { nextValue, nextCaret } = applySuggestionToValue(
      input.value,
      selectionStart,
      selectionEnd,
      suggestion,
    );

    setInputValue(nextValue);
    hideSuggestions();
    requestAnimationFrame(() => {
      const target = inputRef.current;
      if (!target) {
        return;
      }

      target.focus();
      target.setSelectionRange(nextCaret, nextCaret);
    });
  };

  return (
    <div ref={rootRef} className="component-shell simple-editor">
      <label className="simple-editor-label" htmlFor={inputId}>
        Input
      </label>
      <textarea
        id={inputId}
        ref={inputRef}
        className="simple-editor-input"
        spellCheck={false}
        value={inputValue}
        onChange={event => {
          const nextValue = event.target.value;
          setInputValue(nextValue);
          updateSuggestions(nextValue, event.target.selectionStart ?? nextValue.length);
        }}
        onFocus={syncFromInput}
        onBlur={hideSuggestions}
        onClick={syncFromInput}
        onKeyUp={syncFromInput}
        onSelect={syncFromInput}
        onKeyDown={event => {
          if (suggestions.length === 0) {
            return;
          }

          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveSuggestionIndex(current => (current + 1) % suggestions.length);
            return;
          }

          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveSuggestionIndex(current => (current - 1 + suggestions.length) % suggestions.length);
            return;
          }

          if ((event.key === 'Enter' || event.key === 'Tab') && suggestions[activeSuggestionIndex]) {
            event.preventDefault();
            applySuggestion(suggestions[activeSuggestionIndex]);
            return;
          }

          if (event.key === 'Escape') {
            hideSuggestions();
          }
        }}
      />

      <div
        ref={popoverRef}
        className="simple-editor-popover"
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
              className={`simple-editor-suggestion${index === activeSuggestionIndex ? ' is-active' : ''}`}
              onMouseDown={event => {
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

      <div className="simple-editor-controls">
        <SliderControl
          id={fontSizeId}
          label="Font size"
          min="32"
          max="220"
          step="1"
          value={String(fontSize)}
          displayValue={`${fontSize}px`}
          onChange={value => {
            setFontSize(Number(value));
          }}
        />

        <SliderControl
          id={letterSpacingId}
          label="Letter spacing"
          min="-0.2"
          max="0.4"
          step="0.01"
          value={String(letterSpacing)}
          displayValue={`${letterSpacing.toFixed(2)}em`}
          onChange={value => {
            setLetterSpacing(Number(value));
          }}
        />

        <div
          className="simple-editor-preset-control simple-editor-control simple-editor-control--preset"
          role="group"
          aria-label="Preview presets"
        >
          <div className="simple-editor-preset-list">
            {visualPresets.map(preset => (
              <PresetButton
                key={preset.value}
                keywordMap={keywordMap}
                preset={preset}
                selected={preset.value === selectedPresetValue}
                onSelect={setSelectedPresetValue}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="simple-editor-preview-wrap">
        <div className="simple-editor-caption">Preview</div>
        <div className="simple-editor-preview-frame" style={frameStyle}>
          <div className="simple-editor-preview" style={previewStyle}>
            {normalizeEditorContent(inputValue, keywordMap)}
          </div>
        </div>
      </div>
    </div>
  );
};

const SliderControl: FC<{
  id: string;
  label: string;
  min: string;
  max: string;
  step: string;
  value: string;
  displayValue: string;
  onChange: (value: string) => void;
}> = props => {
  const { id, label, min, max, step, value, displayValue, onChange } = props;

  return (
    <label
      className="simple-editor-font-control simple-editor-control"
      htmlFor={id}
    >
      <span className="simple-editor-caption">{label}</span>
      <div className="simple-editor-font-row">
        <input
          id={id}
          className="simple-editor-slider"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={event => {
            onChange(event.target.value);
          }}
        />
        <span className="simple-editor-font-value">{displayValue}</span>
      </div>
    </label>
  );
};

const PresetButton: FC<{
  keywordMap: KeywordMap;
  preset: VisualPreset;
  selected: boolean;
  onSelect: (value: string) => void;
}> = props => {
  const { keywordMap, preset, selected, onSelect } = props;

  return (
    <button
      type="button"
      className={`simple-editor-preset${selected ? ' is-active' : ''}`}
      aria-pressed={String(selected)}
      title={preset.label}
      onClick={() => {
        onSelect(preset.value);
      }}
    >
      <span
        className="simple-editor-preset-preview"
        style={
          {
            '--simple-editor-preset-background': preset.background,
            '--simple-editor-preset-color': preset.color,
            '--simple-editor-preset-shadow': preset.shadow,
          } as CSSProperties
        }
      >
        <span className="simple-editor-preset-glyph">
          {normalizeEditorContent(preset.sample, keywordMap)}
        </span>
      </span>
    </button>
  );
};

export default SimpleEditorClient;

const CARET_STYLE_PROPS = [
  'boxSizing',
  'borderLeftWidth',
  'borderRightWidth',
  'borderTopWidth',
  'borderBottomWidth',
  'direction',
  'fontFamily',
  'fontFeatureSettings',
  'fontKerning',
  'fontSize',
  'fontStretch',
  'fontStyle',
  'fontVariant',
  'fontVariantLigatures',
  'fontWeight',
  'letterSpacing',
  'lineHeight',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'textAlign',
  'tabSize',
  'textIndent',
  'textTransform',
  'whiteSpace',
  'width',
  'wordBreak',
  'wordSpacing',
  'overflowWrap',
] as const;

function getTextareaCaretPosition(textarea: HTMLTextAreaElement, selectionStart: number) {
  const computed = window.getComputedStyle(textarea);
  const mirror = document.createElement('div');
  const marker = document.createElement('span');
  const before = textarea.value.slice(0, selectionStart).replace(/\n$/, '\n\u200b');
  const after = textarea.value.slice(selectionStart);

  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.top = '0';
  mirror.style.left = '0';
  mirror.style.pointerEvents = 'none';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.wordBreak = 'break-word';
  mirror.style.overflowWrap = 'break-word';

  for (const property of CARET_STYLE_PROPS) {
    mirror.style[property] = computed[property];
  }

  mirror.textContent = before;
  marker.textContent = after[0] || '\u200b';
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const borderLeft = Number.parseFloat(computed.borderLeftWidth) || 0;
  const borderTop = Number.parseFloat(computed.borderTopWidth) || 0;
  const left = marker.offsetLeft + borderLeft - textarea.scrollLeft;
  const top = marker.offsetTop + borderTop - textarea.scrollTop;
  const height = marker.offsetHeight || Number.parseFloat(computed.lineHeight) || 16;

  document.body.removeChild(mirror);

  return { left, top, height };
}
