import type { FC } from 'react';

import { getKeywordMap } from '@/lib/alev';

import type { SimpleEditorProps } from './editor-utils';
import SimpleEditorClient from './SimpleEditorClient';

const SimpleEditor: FC<SimpleEditorProps> = props => {
  const keywordMap = Object.fromEntries([...getKeywordMap().entries()].sort(([left], [right]) => left.localeCompare(right)));

  return <SimpleEditorClient {...props} keywordMap={keywordMap} />;
};

export default SimpleEditor;
