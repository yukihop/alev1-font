import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const docsDir = path.resolve(__dirname, '..');
const repoDir = path.resolve(docsDir, '..');

const copies = [
  {
    from: path.join(repoDir, 'font', 'dist', 'alevish.woff2'),
    to: path.join(docsDir, 'public', 'assets', 'alev1.woff2'),
  },
];

await Promise.all(
  copies.map(async ({ from, to }) => {
    await mkdir(path.dirname(to), { recursive: true });
    await copyFile(from, to);
  }),
);
