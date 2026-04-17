import { Children, type ReactNode } from 'react';

export function resolveAlevInlineSource(
  source?: string,
  children?: ReactNode,
): string {
  const text =
    source ??
    Children.toArray(children)
      .map((child) => {
        if (typeof child === 'string') return child;
        if (typeof child === 'number') return String(child);
        return '';
      })
      .join(' ');

  return String(text ?? '').replace(/\s+/g, ' ').trim();
}
