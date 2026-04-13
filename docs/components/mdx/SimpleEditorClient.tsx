'use client';

import type { CSSProperties } from 'react';
import { useId, useRef, useState } from 'react';

import { KeywordSuggestionsPopover, useKeywordSuggestions } from './KeywordSuggestionsPopover';
import {
  DEFAULT_EDITOR_VALUE,
  DEFAULT_FONT_SIZE,
  DEFAULT_LETTER_SPACING,
  applySuggestionToValue,
  defaultVisualPreset,
  getActiveTokenPrefix,
  getKeywordList,
  normalizeEditorContent,
  type KeywordMap,
  type SimpleEditorProps,
  type VisualPreset,
  visualPresets,
} from './simpleEditorShared';
import styles from './Editors.module.css';

export default function SimpleEditorClient(props: SimpleEditorProps) {
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
  const [selectedPresetValue, setSelectedPresetValue] = useState(defaultVisualPreset.value);
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
    visualPresets.find((preset) => preset.value === selectedPresetValue) ?? defaultVisualPreset;
  const previewStyle = {
    '--simple-editor-font-size': `${fontSize}px`,
    '--simple-editor-letter-spacing': `${letterSpacing}em`,
    '--simple-editor-drop-shadow': selectedPreset.shadow,
  } as CSSProperties;
  const frameStyle = {
    '--simple-editor-preview-background': selectedPreset.background,
    '--simple-editor-preview-color': selectedPreset.color,
  } as CSSProperties;

  return (
    <div className={`${styles.panel} ${styles.simpleEditor}`}>
      <label className={styles.label} htmlFor={inputId}>
        Input
      </label>
      <textarea
        id={inputId}
        ref={inputRef}
        className={styles.textarea}
        spellCheck={false}
        value={inputValue}
        onChange={(event) => {
          const nextValue = event.target.value;
          setInputValue(nextValue);
          onChangeHandler(nextValue, event.target.selectionStart ?? nextValue.length);
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

      <div className={styles.controls}>
        <label className={styles.control} htmlFor={fontSizeId}>
          <span className={styles.caption}>Font size</span>
          <div className={styles.fontRow}>
            <input
              id={fontSizeId}
              type="range"
              min="32"
              max="220"
              step="1"
              value={String(fontSize)}
              onChange={(event) => {
                setFontSize(Number(event.target.value));
              }}
            />
            <span className={styles.fontValue}>{fontSize}px</span>
          </div>
        </label>

        <label className={styles.control} htmlFor={letterSpacingId}>
          <span className={styles.caption}>Letter spacing</span>
          <div className={styles.fontRow}>
            <input
              id={letterSpacingId}
              type="range"
              min="-0.2"
              max="0.4"
              step="0.01"
              value={String(letterSpacing)}
              onChange={(event) => {
                setLetterSpacing(Number(event.target.value));
              }}
            />
            <span className={styles.fontValue}>{letterSpacing.toFixed(2)}em</span>
          </div>
        </label>

        <div className={`${styles.control} ${styles.controlPreset}`} role="group" aria-label="Preview presets">
          <span className={styles.caption}>Preview presets</span>
          <div className={styles.presetList}>
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

      <div className={styles.previewWrap}>
        <div className={styles.caption}>Preview</div>
        <div className={styles.previewFrame} style={frameStyle}>
          <div className={styles.previewText} style={previewStyle}>
            {normalizeEditorContent(inputValue, keywordMap)}
          </div>
        </div>
      </div>
    </div>
  );
}

function PresetButton(props: {
  keywordMap: KeywordMap;
  preset: VisualPreset;
  selected: boolean;
  onSelect: (value: string) => void;
}) {
  const { keywordMap, preset, selected, onSelect } = props;

  return (
    <button
      type="button"
      className={`${styles.presetButton} ${selected ? styles.presetButtonActive : ''}`.trim()}
      aria-pressed={selected}
      title={preset.label}
      onClick={() => {
        onSelect(preset.value);
      }}
    >
      <span
        className={styles.presetPreview}
        style={
          {
            '--simple-editor-preset-background': preset.background,
            '--simple-editor-preset-color': preset.color,
            '--simple-editor-preset-shadow': preset.shadow,
          } as CSSProperties
        }
      >
        <span className={styles.presetGlyph}>{normalizeEditorContent(preset.sample, keywordMap)}</span>
      </span>
    </button>
  );
}
