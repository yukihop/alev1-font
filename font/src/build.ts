import { buildFont } from './build-font.ts';
import { buildMetadata } from './build-metadata.ts';
import { buildPreview } from './build-preview.ts';
import { runCheck } from './check.ts';
import { runClean } from './clean.ts';
import { generateFeatures } from './generate-features.ts';
import { generateGlyphs } from './generate-glyphs.ts';

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
