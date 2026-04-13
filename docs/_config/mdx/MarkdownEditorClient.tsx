import MarkdownIt from 'markdown-it';
import { type FC, useId, useMemo, useState } from 'react';

import { type KeywordMap, normalizeEditorContent } from './simpleEditorShared.ts';
import { DEFAULT_MARKDOWN_VALUE, type MarkdownEditorProps } from './markdownEditorShared.ts';

const MarkdownEditorClient: FC<MarkdownEditorProps> = props => {
  const { defaultValue = DEFAULT_MARKDOWN_VALUE, keywordMap } = props;
  const inputId = useId();
  const [inputValue, setInputValue] = useState(defaultValue);
  const renderer = useMemo(() => createMarkdownRenderer(keywordMap), [keywordMap]);
  const previewHtml = useMemo(() => renderer.render(inputValue), [inputValue, renderer]);

  return (
    <div className="component-shell markdown-editor">
      <div className="markdown-editor-grid">
        <section className="markdown-editor-pane markdown-editor-pane--source">
          <label className="markdown-editor-label" htmlFor={inputId}>
            Source
          </label>
          <textarea
            id={inputId}
            className="markdown-editor-textarea"
            spellCheck={false}
            value={inputValue}
            onChange={event => {
              setInputValue(event.target.value);
            }}
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
  renderer.inline.ruler.before('emphasis', 'alev_inline', (state, silent) => {
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

  renderer.renderer.rules.alev_inline = (tokens, index) => {
    const token = tokens[index];
    const source = renderer.utils.escapeHtml(String(token.meta?.source ?? ''));
    const content = renderer.utils.escapeHtml(token.content);

    return `<span class="alev-inline" title="${source}">${content}</span>`;
  };
}

export default MarkdownEditorClient;
