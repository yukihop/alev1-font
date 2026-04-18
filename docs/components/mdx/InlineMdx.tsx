type InlineMdxProps = {
  source?: string | null;
  staticAlev?: boolean;
  hashLinkBase?: string;
};

async function InlineMdx(props: InlineMdxProps) {
  const { source, staticAlev = false, hashLinkBase } = props;
  if (!source) {
    return null;
  }

  const { renderInlineMdx, renderStaticInlineMdx } = await import('@/lib/mdx');

  return staticAlev
    ? renderStaticInlineMdx(source, hashLinkBase)
    : renderInlineMdx(source, hashLinkBase);
}

export default InlineMdx;
