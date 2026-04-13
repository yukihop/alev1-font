import type { Root, Text } from 'mdast';
import { visit } from 'unist-util-visit';

function createAlevNode(source: string) {
  return {
    type: 'mdxJsxTextElement',
    name: 'AlevInline',
    attributes: [
      {
        type: 'mdxJsxAttribute',
        name: 'source',
        value: source,
      },
    ],
    children: [],
  };
}

export function remarkAlevInline() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || typeof index !== 'number') {
        return;
      }

      const value = String(node.value ?? '');
      if (!value.includes(':')) {
        return;
      }

      const pattern = /:([^:\n]+):/g;
      let match: RegExpExecArray | null;
      let cursor = 0;
      const replacement: Array<Text | ReturnType<typeof createAlevNode>> = [];

      while ((match = pattern.exec(value)) !== null) {
        const [raw, inner] = match;
        if (match.index > cursor) {
          replacement.push({
            type: 'text',
            value: value.slice(cursor, match.index),
          });
        }

        replacement.push(createAlevNode(inner.trim()));
        cursor = match.index + raw.length;
      }

      if (replacement.length === 0) {
        return;
      }

      if (cursor < value.length) {
        replacement.push({
          type: 'text',
          value: value.slice(cursor),
        });
      }

      parent.children.splice(index, 1, ...replacement);
      return index + replacement.length;
    });
  };
}
