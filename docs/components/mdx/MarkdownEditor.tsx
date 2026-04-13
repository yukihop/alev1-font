import type { FC } from 'react';

import { getKeywordMap } from '@/lib/alev';

import type { MarkdownEditorProps } from './markdown-editor-utils';
import MarkdownEditorClient from './MarkdownEditorClient';

const MarkdownEditor: FC<MarkdownEditorProps> = props => {
  const keywordMap = Object.fromEntries([...getKeywordMap().entries()].sort(([left], [right]) => left.localeCompare(right)));

  return <MarkdownEditorClient {...props} keywordMap={keywordMap} />;
};

export default MarkdownEditor;
