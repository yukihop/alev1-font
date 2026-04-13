import { type FC } from 'react';

import { getKeywordMap } from '../alev.ts';
import ReactIsland from './ReactIsland.tsx';
import MarkdownEditorClient from './MarkdownEditorClient.tsx';
import { type MarkdownEditorProps, type MarkdownEditorServerProps } from './markdownEditorShared.ts';

const keywordMap = Object.fromEntries(
  [...getKeywordMap().entries()].sort(([left], [right]) => left.localeCompare(right)),
);

const MarkdownEditor: FC<MarkdownEditorServerProps> = props => {
  const clientProps: MarkdownEditorProps = {
    ...props,
    keywordMap,
  };

  return (
    <ReactIsland component="MarkdownEditor" props={clientProps}>
      <MarkdownEditorClient {...clientProps} />
    </ReactIsland>
  );
};

export default MarkdownEditor;
