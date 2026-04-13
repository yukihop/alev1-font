import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { compile as compileMdx, run } from '@mdx-js/mdx';
import matter from 'gray-matter';
import markdownIt from 'markdown-it';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import remarkGfm from 'remark-gfm';
import * as runtime from 'react/jsx-runtime';

import { buildAllAssets } from './scripts/build-client.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const serverDir = path.join(__dirname, '.cache', 'server');
  const alevSignalDemoClientUrl = `${pathToFileURL(path.join(serverDir, 'mdx', 'AlevSignalDemoClient.js')).href}?v=${nonce}`;
  const alevInlineUrl = `${pathToFileURL(path.join(serverDir, 'mdx', 'AlevInline.js')).href}?v=${nonce}`;
  const conceptDictionaryUrl = `${pathToFileURL(path.join(serverDir, 'mdx', 'ConceptDictionary.js')).href}?v=${nonce}`;
  const glyphListClientUrl = `${pathToFileURL(path.join(serverDir, 'mdx', 'GlyphListClient.js')).href}?v=${nonce}`;
  const glyphMatrixClientUrl = `${pathToFileURL(path.join(serverDir, 'mdx', 'GlyphMatrixClient.js')).href}?v=${nonce}`;
  const markdownEditorClientUrl = `${pathToFileURL(path.join(serverDir, 'mdx', 'MarkdownEditorClient.js')).href}?v=${nonce}`;
  const reactIslandUrl = `${pathToFileURL(path.join(serverDir, 'mdx', 'ReactIsland.js')).href}?v=${nonce}`;
  const simpleEditorClientUrl = `${pathToFileURL(path.join(serverDir, 'mdx', 'SimpleEditorClient.js')).href}?v=${nonce}`;
  const alevUrl = `${pathToFileURL(path.join(serverDir, 'alev.js')).href}?v=${nonce}`;
  const remarkUrl = `${pathToFileURL(path.join(serverDir, 'remark-alev-inline.js')).href}?v=${nonce}`;
  const [
    alevSignalDemoClientModule,
    alevInlineModule,
    conceptDictionaryModule,
    glyphListClientModule,
    glyphMatrixClientModule,
    markdownEditorClientModule,
    reactIslandModule,
    simpleEditorClientModule,
    alevModule,
    remarkModule,
  ] = await Promise.all([
    import(alevSignalDemoClientUrl),
    import(alevInlineUrl),
    import(conceptDictionaryUrl),
    import(glyphListClientUrl),
    import(glyphMatrixClientUrl),
    import(markdownEditorClientUrl),
    import(reactIslandUrl),
    import(simpleEditorClientUrl),
    import(alevUrl),
    import(remarkUrl),
  ]);
  const alevData = alevModule.getAlevData();
  const glyphData = {
    glyphs: alevData.glyphs,
    rows: alevData.rows,
    cols: alevData.cols,
  };
  const keywordMap = Object.fromEntries(
    [...alevModule.getKeywordMap().entries()].sort(([left], [right]) => left.localeCompare(right)),
  );
  const renderIsland = (component, clientProps, clientModule) =>
    React.createElement(
      reactIslandModule.default,
      { component, props: clientProps },
      React.createElement(clientModule.default, clientProps),
    );
  const AlevSignalDemo = () => renderIsland('AlevSignalDemo', { glyphs: glyphData.glyphs }, alevSignalDemoClientModule);
  const GlyphMatrix = () => renderIsland('GlyphMatrix', glyphData, glyphMatrixClientModule);
  const GlyphList = () => renderIsland('GlyphList', { glyphs: glyphData.glyphs }, glyphListClientModule);
  const SimpleEditor = props => {
    const clientProps = {
      defaultValue: props.defaultValue,
      defaultFontSize: props.defaultFontSize,
      defaultLetterSpacing: props.defaultLetterSpacing,
      keywordMap,
    };

    return renderIsland('SimpleEditor', clientProps, simpleEditorClientModule);
  };
  const MarkdownEditor = props => {
    const clientProps = {
      defaultValue: props.defaultValue,
      keywordMap,
    };

    return renderIsland('MarkdownEditor', clientProps, markdownEditorClientModule);
  };

  return {
    mdxComponents: {
      AlevSignalDemo,
      AlevInline: alevInlineModule.default,
      GlyphMatrix,
      GlyphList,
      ConceptDictionary: conceptDictionaryModule.default,
      MarkdownEditor,
      SimpleEditor,
      LigatureTester: SimpleEditor,
    },
    remarkAlevInline: remarkModule.remarkAlevInline,
  };
}

export default function (eleventyConfig) {
  eleventyConfig.setLibrary('md', createMarkdownLibrary());
  eleventyConfig.watchIgnores.add('./.cache/**');
  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });
  eleventyConfig.addPassthroughCopy({ '.cache/site-react.js': 'assets/site-react.js' });
  eleventyConfig.addPassthroughCopy({ '.cache/site-react.js.map': 'assets/site-react.js.map' });
  eleventyConfig.addPassthroughCopy({ '../font/dist/alev1.woff2': 'assets/alev1.woff2' });
  eleventyConfig.addWatchTarget('../font/dist/manifest.json');
  eleventyConfig.addWatchTarget('../data/lexicon.yaml');
  eleventyConfig.addWatchTarget('./_config/');
  eleventyConfig.addWatchTarget('./client/');
  eleventyConfig.on('eleventy.before', async () => {
    await buildAllAssets();
  });

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
    async compile(_, inputPath) {
      return async function render() {
        const source = readFileSync(inputPath, 'utf8');
        const parsed = matter(source);
        const { remarkAlevInline, mdxComponents } = await loadMdxRuntime();
        const compiled = await compileMdx(parsed.content, {
          outputFormat: 'function-body',
          providerImportSource: '@mdx-js/react',
          remarkPlugins: [remarkGfm, remarkAlevInline],
        });

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
