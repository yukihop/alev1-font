'use client';

import { createContext, type ReactNode, useContext } from 'react';

import type { LexiconGlyphRecord } from '@alev/data';

import { buildKeywordMap, type KeywordMap, type UsageCounts } from './alev-shared';

type AlevDataContextValue = {
  lexicon: LexiconGlyphRecord[];
  usageCounts: UsageCounts;
};

const AlevDataContext = createContext<AlevDataContextValue | null>(null);

const lexiconMapCache = new WeakMap<LexiconGlyphRecord[], Map<string, LexiconGlyphRecord>>();
const keywordMapCache = new WeakMap<LexiconGlyphRecord[], KeywordMap>();

function getLexiconMap(lexicon: LexiconGlyphRecord[]): Map<string, LexiconGlyphRecord> {
  const cached = lexiconMapCache.get(lexicon);
  if (cached) {
    return cached;
  }

  const next = new Map(lexicon.map((entry) => [entry.binary, entry]));
  lexiconMapCache.set(lexicon, next);
  return next;
}

function getKeywordMap(lexicon: LexiconGlyphRecord[]): KeywordMap {
  const cached = keywordMapCache.get(lexicon);
  if (cached) {
    return cached;
  }

  const next = buildKeywordMap(getLexiconMap(lexicon));
  keywordMapCache.set(lexicon, next);
  return next;
}

export function AlevDataProvider(
  props: AlevDataContextValue & {
    children: ReactNode;
  },
) {
  const { lexicon, usageCounts, children } = props;

  return (
    <AlevDataContext.Provider value={{ lexicon, usageCounts }}>
      {children}
    </AlevDataContext.Provider>
  );
}

export function useAlevData() {
  const value = useContext(AlevDataContext);
  if (!value) {
    throw new Error('Alev data context is not available.');
  }

  return value;
}

export function useAlevClientData() {
  const { lexicon, usageCounts } = useAlevData();
  const lexiconMap = getLexiconMap(lexicon);
  const keywordMap = getKeywordMap(lexicon);

  return {
    lexicon,
    lexiconMap,
    keywordMap,
    usageCounts,
  };
}
