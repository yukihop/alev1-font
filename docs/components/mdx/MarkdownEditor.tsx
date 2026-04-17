import type { FC } from 'react';

import type { MarkdownEditorProps } from './markdown-editor-utils';
import MarkdownEditorClient from './MarkdownEditorClient';

const MarkdownEditor: FC<MarkdownEditorProps> = props => {
  return <MarkdownEditorClient {...props} />;
};

export default MarkdownEditor;
