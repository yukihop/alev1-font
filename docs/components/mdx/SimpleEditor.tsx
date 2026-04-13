import { getKeywordMap } from '@/lib/alev';

import SimpleEditorClient from './SimpleEditorClient';
import type { SimpleEditorServerProps } from './simpleEditorShared';

export default function SimpleEditor(props: SimpleEditorServerProps) {
  const keywordMap = Object.fromEntries([...getKeywordMap().entries()].sort(([left], [right]) => left.localeCompare(right)));

  return <SimpleEditorClient {...props} keywordMap={keywordMap} />;
}
