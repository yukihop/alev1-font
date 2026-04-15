'use client';

import MarkdownIt from 'markdown-it';
import type { FC } from 'react';
import { useId, useMemo, useRef, useState } from 'react';

import RichText from '@/components/RichText';

import alevTextStyles from './AlevText.module.css';
import { KeywordSuggestionsPopover, useKeywordSuggestions } from './KeywordSuggestionsPopover';
import styles from './Editors.module.css';
import {
  DEFAULT_MARKDOWN_VALUE,
  applyMarkdownSuggestion,
  getMarkdownTokenPrefix,
  type MarkdownEditorPanelProps,
} from './markdown-editor-utils';
import { getKeywordList, normalizeEditorContent } from './editor-utils';

const createMarkdownRenderer = (keywordMap: Record<string, string>, alevInlineClassName: string): MarkdownIt => {
  const renderer = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    breaks: true,
  });

  renderer.inline.ruler.before('emphasis', 'alev_inline', (state: any, silent: boolean) => {
    const start = state.pos;

    if (state.src.charCodeAt(start) !== 0x3a) {
      return false;
    }

    const end = state.src.indexOf(':', start + 1);
    if (end === -1 || end === start + 1) {
      return false;
    }

    const source = state.src.slice(start + 1, end).trim();
    if (!source) {
      return false;
    }

    if (silent) {
      return true;
    }

    const token = state.push('alev_inline', 'span', 0);
    token.meta = { source };
    token.content = normalizeEditorContent(source, keywordMap);
    state.pos = end + 1;
    return true;
  });

  renderer.renderer.rules.alev_inline = (tokens: any[], index: number) => {
    const token = tokens[index];
    const source = renderer.utils.escapeHtml(String(token.meta?.source ?? ''));
    const content = renderer.utils.escapeHtml(token.content);
    return `<span class="${alevInlineClassName}" title="${source}">${content}</span>`;
  };

  return renderer;
};

const MarkdownEditorClient: FC<MarkdownEditorPanelProps> = props => {
  const { defaultValue = DEFAULT_MARKDOWN_VALUE, keywordMap } = props;
  const inputId = useId();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const keywordList = getKeywordList(keywordMap);
  const [inputValue, setInputValue] = useState(defaultValue);
  const renderer = useMemo(
    () => createMarkdownRenderer(keywordMap, `${styles.alevInline} ${alevTextStyles.glyphText}`),
    [keywordMap],
  );
  const previewHtml = useMemo(() => renderer.render(inputValue), [inputValue, renderer]);
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
    getPrefix: getMarkdownTokenPrefix,
    applyToValue: applyMarkdownSuggestion,
    onApply: setInputValue,
  });

  return (
    <div className={`${styles.panel} ${styles.markdownEditor}`}>
      <div className={styles.markdownGrid}>
        <section className={styles.markdownPane}>
          <label className={styles.label} htmlFor={inputId}>
            Source
          </label>
          <textarea
            id={inputId}
            ref={inputRef}
            className={`${styles.textarea} ${styles.markdownTextarea}`}
            spellCheck={false}
            value={inputValue}
            onChange={event => {
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
        </section>

        <section className={styles.markdownPane}>
          <div className={styles.label}>Preview</div>
          <div className={styles.previewPane}>
            <RichText>
              <div className={styles.previewContent} dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </RichText>
          </div>
        </section>
      </div>

      <KeywordSuggestionsPopover
        popoverRef={popoverRef}
        suggestions={suggestions}
        activeSuggestionIndex={activeSuggestionIndex}
        popoverPosition={popoverPosition}
        applySuggestion={applySuggestion}
        keywordMap={keywordMap}
      />
    </div>
  );
};

export default MarkdownEditorClient;
