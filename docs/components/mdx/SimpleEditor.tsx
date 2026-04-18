import type { FC } from 'react';

import { loadKeywordMap } from '@/lib/alev';

import type { SimpleEditorProps } from './editor-utils';
import SimpleEditorClient from './SimpleEditorClient';

const SimpleEditor: FC<SimpleEditorProps> = props => {
  return <SimpleEditorClient {...props} keywordMap={loadKeywordMap()} />;
};

export default SimpleEditor;
