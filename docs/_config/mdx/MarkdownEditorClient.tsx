import MarkdownIt from "markdown-it";
import { type FC, useId, useMemo, useRef, useState } from "react";

import {
  KeywordSuggestionsPopover,
  useKeywordSuggestions,
} from "./KeywordSuggestionsPopover.tsx";
import {
  type KeywordMap,
  getKeywordList,
  normalizeEditorContent,
} from "./simpleEditorShared.ts";
import {
  applyMarkdownSuggestion,
  DEFAULT_MARKDOWN_VALUE,
  getMarkdownTokenPrefix,
  type MarkdownEditorProps,
} from "./markdownEditorShared.ts";

const MarkdownEditorClient: FC<MarkdownEditorProps> = (props) => {
  const { defaultValue = DEFAULT_MARKDOWN_VALUE, keywordMap } = props;
  const inputId = useId();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const keywordList = getKeywordList(keywordMap);
  const [inputValue, setInputValue] = useState(defaultValue);
  const renderer = useMemo(
    () => createMarkdownRenderer(keywordMap),
    [keywordMap],
  );
  const previewHtml = useMemo(
    () => renderer.render(inputValue),
    [inputValue, renderer],
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
    getPrefix: getMarkdownTokenPrefix,
    applyToValue: applyMarkdownSuggestion,
    onApply: setInputValue,
  });

  return (
    <div className="component-shell markdown-editor">
      <div className="markdown-editor-grid">
        <section className="markdown-editor-pane markdown-editor-pane--source">
          <label className="markdown-editor-label" htmlFor={inputId}>
            Source
          </label>
          <textarea
            id={inputId}
            ref={inputRef}
            className="markdown-editor-textarea"
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
        </section>

        <section className="markdown-editor-pane markdown-editor-pane--preview">
          <div className="markdown-editor-label">Preview</div>
          <div className="markdown-editor-preview">
            <div
              className="markdown-editor-preview-content"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
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

function createMarkdownRenderer(keywordMap: KeywordMap): MarkdownIt {
  const renderer = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    breaks: true,
  });

  renderer.use(addAlevInlineRule, keywordMap);

  return renderer;
}

function addAlevInlineRule(renderer: MarkdownIt, keywordMap: KeywordMap): void {
  renderer.inline.ruler.before("emphasis", "alev_inline", (state, silent) => {
    const start = state.pos;

    if (state.src.charCodeAt(start) !== 0x3a) {
      return false;
    }

    const end = state.src.indexOf(":", start + 1);
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

    const token = state.push("alev_inline", "span", 0);
    token.meta = { source };
    token.content = normalizeEditorContent(source, keywordMap);
    state.pos = end + 1;
    return true;
  });

  renderer.renderer.rules.alev_inline = (tokens, index) => {
    const token = tokens[index];
    const source = renderer.utils.escapeHtml(String(token.meta?.source ?? ""));
    const content = renderer.utils.escapeHtml(token.content);

    return `<span class="alev-inline" title="${source}">${content}</span>`;
  };
}

export default MarkdownEditorClient;
