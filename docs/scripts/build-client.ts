import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const docsDir = path.resolve(__dirname, "..");
const clientOutfile = path.join(docsDir, ".cache", "site-react.js");
const serverOutdir = path.join(docsDir, ".cache", "server");

export async function buildClientAssets() {
  await build({
    entryPoints: [path.join(docsDir, "client", "site-react.tsx")],
    outfile: clientOutfile,
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    jsx: "automatic",
    minify: true,
    sourcemap: true,
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    legalComments: "none",
    logLevel: "info",
  });
}

export async function buildServerAssets() {
  await build({
    entryPoints: [
      path.join(docsDir, "_config", "alev.ts"),
      path.join(docsDir, "_config", "remark-alev-inline.ts"),
      path.join(docsDir, "_config", "mdx", "AlevInline.tsx"),
      path.join(docsDir, "_config", "mdx", "CopyPill.tsx"),
      path.join(docsDir, "_config", "mdx", "ConceptDictionary.tsx"),
      path.join(docsDir, "_config", "mdx", "GlyphListClient.tsx"),
      path.join(docsDir, "_config", "mdx", "GlyphMatrixClient.tsx"),
      path.join(docsDir, "_config", "mdx", "KeywordSuggestionsPopover.tsx"),
      path.join(docsDir, "_config", "mdx", "MarkdownEditorClient.tsx"),
      path.join(docsDir, "_config", "mdx", "ReactIsland.tsx"),
      path.join(docsDir, "_config", "mdx", "SimpleEditorClient.tsx"),
    ],
    outdir: serverOutdir,
    outbase: path.join(docsDir, "_config"),
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node20",
    jsx: "automatic",
    sourcemap: false,
    minify: false,
    packages: "external",
    logLevel: "info",
  });
}

export async function buildAllAssets() {
  await Promise.all([buildClientAssets(), buildServerAssets()]);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  await buildAllAssets();
}
