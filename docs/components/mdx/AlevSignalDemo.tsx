import type { FC } from 'react';

import { loadCorpus, loadKeywordMap } from '@/lib/alev';
import { tokenizeAlevLine } from '@/lib/alev-shared';

import AlevSignalDemoClient from './AlevSignalDemoClient';

const AlevSignalDemo: FC = () => {
  const keywordMap = loadKeywordMap();
  const lines = loadCorpus().sections.flatMap(section =>
    section.items.flatMap(item => (item.type === 'entry' && item.alevLines ? item.alevLines : [])),
  );
  const sentences = [...new Set(lines)]
    .map(line =>
      tokenizeAlevLine(line, keywordMap).flatMap(fragment =>
        fragment.type === 'token' && fragment.resolvedBinary ? [fragment.resolvedBinary] : [],
      ),
    )
    .filter(sentence => sentence.length > 0);

  return <AlevSignalDemoClient sentences={sentences} />;
};

export default AlevSignalDemo;
