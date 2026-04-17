import type { FC } from 'react';

import type { SimpleEditorProps } from './editor-utils';
import SimpleEditorClient from './SimpleEditorClient';

const SimpleEditor: FC<SimpleEditorProps> = props => {
  return <SimpleEditorClient {...props} />;
};

export default SimpleEditor;
