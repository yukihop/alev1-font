import React from 'react';
import { hydrateRoot } from 'react-dom/client';

import SimpleEditorClient from '../_config/mdx/SimpleEditorClient.tsx';
import { type SimpleEditorProps } from '../_config/mdx/simpleEditorShared.ts';

const islandRegistry = {
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
    const props = JSON.parse(rawProps) as SimpleEditorProps;
    hydrateRoot(root, React.createElement(Component, props));
  }
}

hydrateIslands();
