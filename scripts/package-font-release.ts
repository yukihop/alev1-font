import { copyFile, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

import { DIST_DIR, DONOR_LICENSE_PATH, FONT_DIR, REPO_DIR, loadGlyphModel } from '../font/src/shared.ts';

const RELEASE_DIR = path.join(REPO_DIR, 'release');
const STAGING_ROOT = path.join(REPO_DIR, '.release');
const TAG_PATTERN = /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

async function main() {
  const tag = process.argv[2];
  if (!tag || !TAG_PATTERN.test(tag)) {
    throw new Error('Usage: node scripts/package-font-release.ts v0.1.0');
  }

  const model = await loadGlyphModel();
  const outputBase = model.font.outputFileBase;
  const releaseBaseName = `${outputBase}-${tag}`;
  const stageDir = path.join(STAGING_ROOT, releaseBaseName);
  const zipPath = path.join(RELEASE_DIR, `${releaseBaseName}.zip`);

  const requiredFiles = [
    path.join(DIST_DIR, `${outputBase}.ttf`),
    path.join(DIST_DIR, `${outputBase}.woff2`),
    DONOR_LICENSE_PATH,
    path.join(FONT_DIR, 'NOTICE.txt'),
  ];

  for (const filePath of requiredFiles) {
    await assertFile(filePath);
  }

  await rm(stageDir, { recursive: true, force: true });
  await mkdir(stageDir, { recursive: true });
  await mkdir(RELEASE_DIR, { recursive: true });

  await copyFile(path.join(DIST_DIR, `${outputBase}.ttf`), path.join(stageDir, `${outputBase}.ttf`));
  await copyFile(path.join(DIST_DIR, `${outputBase}.woff2`), path.join(stageDir, `${outputBase}.woff2`));
  await copyFile(DONOR_LICENSE_PATH, path.join(stageDir, 'OFL.txt'));
  await copyFile(path.join(FONT_DIR, 'NOTICE.txt'), path.join(stageDir, 'NOTICE.txt'));

  await rm(zipPath, { force: true });
  const python = resolvePythonBinary();
  await runCommand(python, ['-m', 'zipfile', '-c', zipPath, releaseBaseName], { cwd: STAGING_ROOT });

  console.log(`packaged ${zipPath}`);
}

async function assertFile(filePath) {
  let fileStat;
  try {
    fileStat = await stat(filePath);
  } catch {
    throw new Error(`Required release file is missing: ${filePath}`);
  }

  if (!fileStat.isFile()) {
    throw new Error(`Required release path is not a file: ${filePath}`);
  }
}

function resolvePythonBinary() {
  const candidates = [process.env.PYTHON_BIN, 'python3', 'python'].filter(Boolean);
  for (const candidate of candidates) {
    const resolved = findCommandInPath(candidate);
    if (resolved) {
      return resolved;
    }
  }

  throw new Error('python3 or python is required to package the release zip');
}

function findCommandInPath(commandName) {
  if (path.isAbsolute(commandName) && existsSync(commandName)) {
    return commandName;
  }

  const pathEntries = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
  for (const entry of pathEntries) {
    const candidate = path.join(entry, commandName);
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...options,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`));
    });
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
