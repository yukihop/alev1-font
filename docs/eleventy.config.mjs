import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { compile as compileMdx, run } from '@mdx-js/mdx';
import matter from 'gray-matter';
import markdownIt from 'markdown-it';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as runtime from 'react/jsx-runtime';

const __filename = fileURLToPath(import.meta.url);
let mdxRuntimeCache = null;

function getNavSlug(entry) {
  if (entry.fileSlug) {
    return entry.fileSlug;
  }

  if (entry.inputPath) {
    const baseName = path.basename(entry.inputPath, path.extname(entry.inputPath));
    return baseName === 'index' ? 'index' : baseName;
  }

  return '';
}

function createMarkdownLibrary() {
  return markdownIt({
    html: true,
    linkify: true,
    typographer: true,
  });
}

async function loadMdxRuntime() {
  if (!mdxRuntimeCache) {
    mdxRuntimeCache = Promise.all([
      import('./_config/mdx-components.tsx'),
      import('./_config/remark-alev-inline.ts'),
    ]).then(([mdxComponentsModule, remarkModule]) => ({
      mdxComponents: mdxComponentsModule.mdxComponents,
      remarkAlevInline: remarkModule.remarkAlevInline,
    }));
  }

  return mdxRuntimeCache;
}

export default function (eleventyConfig) {
  eleventyConfig.setLibrary('md', createMarkdownLibrary());
  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });
  eleventyConfig.addPassthroughCopy({ '../font/dist/alev1.woff2': 'assets/alev1.woff2' });
  eleventyConfig.addWatchTarget('../font/dist/manifest.json');
  eleventyConfig.addWatchTarget('../data/lexicon.yaml');

  eleventyConfig.addCollection('docsNav', (collectionApi) => {
    return collectionApi
      .getFilteredByTag('docs')
      .sort((left, right) => {
        const leftSlug = getNavSlug(left);
        const rightSlug = getNavSlug(right);
        const leftOrder = Number.isFinite(left.data.navOrder) ? left.data.navOrder : Number.POSITIVE_INFINITY;
        const rightOrder = Number.isFinite(right.data.navOrder) ? right.data.navOrder : Number.POSITIVE_INFINITY;

        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder;
        }

        return leftSlug.localeCompare(rightSlug);
      });
  });

  eleventyConfig.addExtension('mdx', {
    key: 'mdx',
    outputFileExtension: 'html',
    getData(inputPath) {
      const source = readFileSync(inputPath, 'utf8');
      const parsed = matter(source);
      return parsed.data;
    },
    async compile(inputContent, inputPath) {
      const parsed = matter(inputContent);
      const { remarkAlevInline, mdxComponents } = await loadMdxRuntime();
      const compiled = await compileMdx(parsed.content, {
        outputFormat: 'function-body',
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [remarkAlevInline],
      });

      return async function render() {
        const module = await run(compiled, {
          ...runtime,
          baseUrl: pathToFileURL(inputPath),
          useMDXComponents: () => mdxComponents,
        });

        return renderToStaticMarkup(
          React.createElement(module.default, {
            components: mdxComponents,
          }),
        );
      };
    },
  });

  return {
    dir: {
      input: 'src',
      includes: '_includes',
      data: '_data',
      output: '_site',
    },
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    templateFormats: ['mdx', 'md', 'njk'],
  };
}
