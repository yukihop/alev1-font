import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
const siteDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.resolve(siteDir, '..');
export default defineConfig({
    plugins: [react()],
    build: {
        assetsInlineLimit: 0,
    },
    server: {
        fs: {
            allow: [repoDir],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(siteDir, './src'),
        },
    },
});
