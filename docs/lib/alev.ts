import { cache } from 'react';

import {
  loadCorpusDocument,
  loadLexiconData,
} from '@alev/data';
import { buildKeywordMap, collectUsageCounts } from './alev-shared';

export const loadLexicon = cache(() => loadLexiconData());

export const loadCorpus = cache(() => loadCorpusDocument());

export const loadKeywordMap = cache(() => buildKeywordMap(loadLexicon()));

export const loadUsageCounts = cache(() =>
  collectUsageCounts(loadCorpus(), loadKeywordMap()),
);
