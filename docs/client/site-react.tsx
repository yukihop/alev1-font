import React from 'react';
import { hydrateRoot } from 'react-dom/client';

import AlevSignalDemoClient, { type AlevSignalDemoProps } from '../_config/mdx/AlevSignalDemoClient.tsx';
import GlyphListClient, { type GlyphListProps } from '../_config/mdx/GlyphListClient.tsx';
import GlyphMatrixClient from '../_config/mdx/GlyphMatrixClient.tsx';
import MarkdownEditorClient from '../_config/mdx/MarkdownEditorClient.tsx';
import SimpleEditorClient from '../_config/mdx/SimpleEditorClient.tsx';
import { type GlyphMatrixProps } from '../_config/mdx/GlyphMatrixClient.tsx';
import { type MarkdownEditorProps } from '../_config/mdx/markdownEditorShared.ts';
import { type SimpleEditorProps } from '../_config/mdx/simpleEditorShared.ts';

const islandRegistry = {
  AlevSignalDemo: AlevSignalDemoClient,
  GlyphList: GlyphListClient,
  GlyphMatrix: GlyphMatrixClient,
  MarkdownEditor: MarkdownEditorClient,
  SimpleEditor: SimpleEditorClient,
  LigatureTester: SimpleEditorClient,
} as const;

function hydrateIslands() {
  const roots = document.querySelectorAll<HTMLElement>('[data-react-island]');

  for (const root of roots) {
    const componentName = root.dataset.reactIsland as keyof typeof islandRegistry | undefined;
    if (!componentName) {
      continue;
    }

    const Component = islandRegistry[componentName];
    if (!Component) {
      continue;
    }

    const rawProps = root.dataset.reactProps ?? '{}';
    const props = JSON.parse(rawProps) as AlevSignalDemoProps | GlyphListProps | GlyphMatrixProps | SimpleEditorProps | MarkdownEditorProps;
    hydrateRoot(root, React.createElement(Component, props));
  }
}

hydrateIslands();
