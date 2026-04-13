import { getKeywordMap } from '@/lib/alev';

import MarkdownEditorClient from './MarkdownEditorClient';
import type { MarkdownEditorServerProps } from './markdownEditorShared';

export default function MarkdownEditor(props: MarkdownEditorServerProps) {
  const keywordMap = Object.fromEntries([...getKeywordMap().entries()].sort(([left], [right]) => left.localeCompare(right)));

  return <MarkdownEditorClient {...props} keywordMap={keywordMap} />;
}
