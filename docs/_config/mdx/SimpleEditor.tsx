import { type FC } from 'react';

import { getKeywordMap } from '../alev.ts';
import ReactIsland from './ReactIsland.tsx';
import SimpleEditorClient from './SimpleEditorClient.tsx';
import { type SimpleEditorProps, type SimpleEditorServerProps } from './simpleEditorShared.ts';

const keywordMap = Object.fromEntries(
  [...getKeywordMap().entries()].sort(([left], [right]) => left.localeCompare(right)),
);

const SimpleEditor: FC<SimpleEditorServerProps> = props => {
  const clientProps: SimpleEditorProps = {
    ...props,
    keywordMap,
  };

  return (
    <ReactIsland component="SimpleEditor" props={clientProps}>
      <SimpleEditorClient {...clientProps} />
    </ReactIsland>
  );
};

export default SimpleEditor;
