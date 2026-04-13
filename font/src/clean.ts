import { resetDir, GENERATED_DIR, DIST_DIR, isMain } from './shared.ts';

export async function runClean() {
  await resetDir(GENERATED_DIR);
  await resetDir(DIST_DIR);
}

if (isMain(import.meta)) {
  runClean().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
