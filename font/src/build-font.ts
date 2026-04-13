import { existsSync } from 'node:fs';
import { copyFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

import {
  DONOR_FONT_PATH,
  DONOR_LICENSE_PATH,
  DIST_DIR,
  FONT_DIR,
  GENERATED_DIR,
  isMain,
  listFiles,
  loadGlyphModel,
  REPO_DIR,
} from './shared.ts';

export async function buildFont() {
  const model = await loadGlyphModel();
  const uv = resolveUvBinary();

  await runCommand(uv, ['sync', '--project', '.'], { cwd: FONT_DIR });
  await runCommand(
    uv,
    ['run', '--project', '.', 'fontmake', '-u', path.join(GENERATED_DIR, 'source.ufo'), '-o', 'ttf', '--output-dir', DIST_DIR],
    { cwd: FONT_DIR },
  );

  const ttfFiles = (await listFiles(DIST_DIR)).filter((fileName) => fileName.endsWith('.ttf'));
  if (ttfFiles.length !== 1) {
    throw new Error(`Expected exactly one TTF output, received ${ttfFiles.length}`);
  }

  const canonicalTtf = path.join(DIST_DIR, `${model.font.outputFileBase}.ttf`);
  const generatedTtf = path.join(DIST_DIR, ttfFiles[0]);
  if (generatedTtf !== canonicalTtf) {
    await rm(canonicalTtf, { force: true });
    await rename(generatedTtf, canonicalTtf);
  }

  await runCommand(
    uv,
    ['run', '--project', '.', 'python', 'scripts/merge_ascii_from_donor.py', canonicalTtf, DONOR_FONT_PATH],
    { cwd: FONT_DIR },
  );

  await runCommand(
    uv,
    [
      'run',
      '--project',
      '.',
      'python',
      'scripts/ttf_to_woff2.py',
      canonicalTtf,
      path.join(DIST_DIR, `${model.font.outputFileBase}.woff2`),
    ],
    { cwd: FONT_DIR },
  );

  await copyFile(DONOR_LICENSE_PATH, path.join(DIST_DIR, path.basename(DONOR_LICENSE_PATH)));

  console.log(`built ${model.font.outputFileBase}.ttf and ${model.font.outputFileBase}.woff2`);
}

function resolveUvBinary() {
  if (process.env.UV_BIN) {
    return process.env.UV_BIN;
  }

  const localUv = path.join(REPO_DIR, '.local', 'uv', 'uv');
  return existsSync(localUv) ? localUv : 'uv';
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...options,
      stdio: 'inherit',
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`));
    });
  });
}

if (isMain(import.meta)) {
  buildFont().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
