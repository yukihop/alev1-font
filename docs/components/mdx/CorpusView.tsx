import CorpusViewClient from './CorpusViewClient';
import { buildCorpusRenderableSections } from './corpus-renderable';

async function CorpusView() {
  const { sections, glyphByBinary } = buildCorpusRenderableSections();

  return <CorpusViewClient sections={sections} glyphByBinary={glyphByBinary} />;
}

export default CorpusView;
