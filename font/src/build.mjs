import { buildFont } from './build-font.mjs';
import { buildMetadata } from './build-metadata.mjs';
import { buildPreview } from './build-preview.mjs';
import { runCheck } from './check.mjs';
import { runClean } from './clean.mjs';
import { generateFeatures } from './generate-features.mjs';
import { generateGlyphs } from './generate-glyphs.mjs';

async function build() {
  await runClean();
  await runCheck();
  await generateGlyphs();
  await generateFeatures();
  await buildMetadata();
  await buildFont();
  await buildPreview();
}

build().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
