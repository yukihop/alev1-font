"use client";

import type { CSSProperties, FC } from "react";
import { useId, useRef, useState } from "react";

import {
  KeywordSuggestionsPopover,
  useKeywordSuggestions,
} from "./KeywordSuggestionsPopover";
import alevTextStyles from "./AlevText.module.css";
import { useSourceData } from "./SourceDataProvider";
import {
  DEFAULT_EDITOR_VALUE,
  DEFAULT_FONT_SIZE,
  DEFAULT_LETTER_SPACING,
  applySuggestionToValue,
  buildPreviewShadow,
  buildSvgDownloadUrl,
  canonicalizeEditorContent,
  defaultVisualPreset,
  getActiveTokenPrefix,
  getKeywordList,
  normalizeEditorContent,
  type KeywordMap,
  type SimpleEditorProps,
  type VisualPreset,
  visualPresets,
} from "./editor-utils";
import styles from "./Editors.module.css";

type PresetButtonProps = {
  keywordMap: Record<string, string>;
  preset: VisualPreset;
  selected: boolean;
  onSelect: (value: string) => void;
};

const PresetButton: FC<PresetButtonProps> = (props) => {
  const { keywordMap, preset, selected, onSelect } = props;
  const previewStyle = {
    "--simple-editor-preset-background": preset.background,
    "--simple-editor-preset-color": preset.color,
    "--simple-editor-preset-shadow": buildPreviewShadow(preset.shadowColor),
  } as CSSProperties;

  return (
    <button
      type="button"
      className={`${styles.presetButton} ${selected ? styles.presetButtonActive : ""}`.trim()}
      aria-pressed={selected}
      title={preset.label}
      onClick={() => {
        onSelect(preset.value);
      }}
    >
      <span className={styles.presetPreview} style={previewStyle}>
        <span className={`${styles.presetGlyph} ${alevTextStyles.glyphText}`}>
          {normalizeEditorContent(preset.sample, keywordMap)}
        </span>
      </span>
    </button>
  );
};

const SimpleEditorClient: FC<SimpleEditorProps> = (props) => {
  const {
    defaultValue = DEFAULT_EDITOR_VALUE,
    defaultFontSize = DEFAULT_FONT_SIZE,
    defaultLetterSpacing = DEFAULT_LETTER_SPACING,
  } = props;
  const {
    sourceData: { keywordMap: sourceKeywordMap },
  } = useSourceData();
  const keywordMap = Object.fromEntries(
    Object.entries(sourceKeywordMap).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  ) as KeywordMap;
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
    "--simple-editor-font-size": `${fontSize}pt`,
    "--simple-editor-letter-spacing": `${letterSpacing / 1000}em`,
    "--simple-editor-drop-shadow": buildPreviewShadow(
      selectedPreset.shadowColor,
    ),
    "--simple-editor-preview-color": selectedPreset.color,
  } as CSSProperties;
  const frameStyle = {
    "--simple-editor-preview-background": selectedPreset.background,
  } as CSSProperties;
  const canonicalized = canonicalizeEditorContent(inputValue, keywordMap);
  const downloadHref = canonicalized.ok
    ? buildSvgDownloadUrl({
        text: canonicalized.text,
        fontSize,
        letterSpacing,
        color: selectedPreset.color,
        shadowColor: selectedPreset.shadowColor,
        backgroundColor:
          selectedPreset.background === "#ffffff"
            ? null
            : selectedPreset.background,
      })
    : null;
  const downloadStatus = canonicalized.ok
    ? null
    : canonicalized.token
      ? `SVGを書き出せません: ${canonicalized.reason} (${canonicalized.token})`
      : `SVGを書き出せません: ${canonicalized.reason}`;

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

      <div className={styles.controls}>
        <label className={styles.control} htmlFor={fontSizeId}>
          <span className={styles.caption}>Font size (pt)</span>
          <div className={styles.fontRow}>
            <input
              id={fontSizeId}
              type="range"
              min="9"
              max="220"
              step="1"
              value={String(fontSize)}
              onChange={(event) => {
                setFontSize(Number(event.target.value));
              }}
            />
            <span className={styles.fontValue}>{fontSize}pt</span>
          </div>
        </label>

        <label className={styles.control} htmlFor={letterSpacingId}>
          <span className={styles.caption}>Letter spacing (1/1000em)</span>
          <div className={styles.fontRow}>
            <input
              id={letterSpacingId}
              type="range"
              min="-200"
              max="400"
              step="10"
              value={String(letterSpacing)}
              onChange={(event) => {
                setLetterSpacing(Number(event.target.value));
              }}
            />
            <span className={styles.fontValue}>{letterSpacing}</span>
          </div>
        </label>

        <div
          className={`${styles.control} ${styles.controlWide}`}
          role="group"
          aria-label="Preview presets"
        >
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
        <div className={styles.caption}>プレビュー</div>
        <div className={styles.previewFrame} style={frameStyle}>
          <div className={`${styles.previewText} ${alevTextStyles.glyphText}`} style={previewStyle}>
            {normalizeEditorContent(inputValue, keywordMap)}
          </div>
        </div>
      </div>

      <div className={styles.actionRow}>
        {downloadHref ? (
          <a
            className={styles.downloadLink}
            href={downloadHref}
            target="_blank"
            rel="noreferrer"
          >
            Download SVG
          </a>
        ) : (
          <span
            className={`${styles.downloadLink} ${styles.downloadLinkDisabled}`}
            aria-disabled="true"
          >
            Download SVG
          </span>
        )}
        {downloadStatus ? (
          <div className={`${styles.helpText} ${styles.errorText}`}>
            {downloadStatus}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SimpleEditorClient;
