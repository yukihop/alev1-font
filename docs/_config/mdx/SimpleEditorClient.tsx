import { type CSSProperties, type FC, useId, useRef, useState } from "react";

import {
  KeywordSuggestionsPopover,
  useKeywordSuggestions,
} from "./KeywordSuggestionsPopover.tsx";
import {
  applySuggestionToValue,
  DEFAULT_EDITOR_VALUE,
  DEFAULT_FONT_SIZE,
  DEFAULT_LETTER_SPACING,
  defaultVisualPreset,
  getActiveTokenPrefix,
  getKeywordList,
  normalizeEditorContent,
  type KeywordMap,
  type SimpleEditorProps,
  type VisualPreset,
  visualPresets,
} from "./simpleEditorShared.ts";

const SimpleEditorClient: FC<SimpleEditorProps> = (props) => {
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
  const keywordList = getKeywordList(keywordMap);
  const [inputValue, setInputValue] = useState(defaultValue);
  const [fontSize, setFontSize] = useState(defaultFontSize);
  const [letterSpacing, setLetterSpacing] = useState(defaultLetterSpacing);
  const [selectedPresetValue, setSelectedPresetValue] = useState(
    defaultVisualPreset.value,
  );
  const {
    popoverRef,
    suggestions,
    activeSuggestionIndex,
    popoverPosition,
    syncFromInput,
    hideSuggestions,
    applySuggestion,
    onChangeHandler,
    onKeyDownHandler,
  } = useKeywordSuggestions(inputRef, keywordList, {
    getPrefix: getActiveTokenPrefix,
    applyToValue: applySuggestionToValue,
    onApply: setInputValue,
  });
  const selectedPreset =
    visualPresets.find((preset) => preset.value === selectedPresetValue) ??
    defaultVisualPreset;
  const previewStyle = {
    "--simple-editor-font-size": `${fontSize}px`,
    "--simple-editor-letter-spacing": `${letterSpacing}em`,
    "--simple-editor-drop-shadow": selectedPreset.shadow,
  } as CSSProperties;
  const frameStyle = {
    "--simple-editor-preview-background": selectedPreset.background,
    "--simple-editor-preview-color": selectedPreset.color,
  } as CSSProperties;

  return (
    <div className="component-shell simple-editor">
      <label className="simple-editor-label" htmlFor={inputId}>
        Input
      </label>
      <textarea
        id={inputId}
        ref={inputRef}
        className="simple-editor-input"
        spellCheck={false}
        value={inputValue}
        onChange={(event) => {
          const nextValue = event.target.value;
          setInputValue(nextValue);
          onChangeHandler(
            nextValue,
            event.target.selectionStart ?? nextValue.length,
          );
        }}
        onFocus={syncFromInput}
        onBlur={hideSuggestions}
        onClick={syncFromInput}
        onKeyUp={syncFromInput}
        onSelect={syncFromInput}
        onKeyDown={onKeyDownHandler}
      />

      <KeywordSuggestionsPopover
        popoverRef={popoverRef}
        suggestions={suggestions}
        activeSuggestionIndex={activeSuggestionIndex}
        popoverPosition={popoverPosition}
        applySuggestion={applySuggestion}
        keywordMap={keywordMap}
      />

      <div className="simple-editor-controls">
        <SliderControl
          id={fontSizeId}
          label="Font size"
          min="32"
          max="220"
          step="1"
          value={String(fontSize)}
          displayValue={`${fontSize}px`}
          onChange={(value) => {
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
          onChange={(value) => {
            setLetterSpacing(Number(value));
          }}
        />

        <div
          className="simple-editor-preset-control simple-editor-control simple-editor-control--preset"
          role="group"
          aria-label="Preview presets"
        >
          <div className="simple-editor-preset-list">
            {visualPresets.map((preset) => (
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
}> = (props) => {
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
          onChange={(event) => {
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
}> = (props) => {
  const { keywordMap, preset, selected, onSelect } = props;

  return (
    <button
      type="button"
      className={`simple-editor-preset${selected ? " is-active" : ""}`}
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
            "--simple-editor-preset-background": preset.background,
            "--simple-editor-preset-color": preset.color,
            "--simple-editor-preset-shadow": preset.shadow,
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
