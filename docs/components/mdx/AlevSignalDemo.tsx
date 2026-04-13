import { getAlevData } from '@/lib/alev';

import AlevSignalDemoClient from './AlevSignalDemoClient';

export default function AlevSignalDemo() {
  const { glyphs } = getAlevData();
  return <AlevSignalDemoClient glyphs={glyphs} />;
}
