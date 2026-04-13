import type { FC } from 'react';

import { getAlevData } from '@/lib/alev';

import AlevSignalDemoClient from './AlevSignalDemoClient';

const AlevSignalDemo: FC = () => {
  const { glyphs } = getAlevData();
  return <AlevSignalDemoClient glyphs={glyphs} />;
};

export default AlevSignalDemo;
