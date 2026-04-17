import CorpusViewClient from './CorpusViewClient';
import { buildCorpusRenderableSections } from './corpus-renderable';

async function CorpusView() {
  const sections = buildCorpusRenderableSections();

  return <CorpusViewClient sections={sections} />;
}

export default CorpusView;
