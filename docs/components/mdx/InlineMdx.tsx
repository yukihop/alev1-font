import { renderInlineMdx, renderStaticInlineMdx } from '@/lib/mdx';

type InlineMdxProps = {
  source?: string | null;
  staticAlev?: boolean;
};

async function InlineMdx(props: InlineMdxProps) {
  const { source, staticAlev = false } = props;
  if (!source) {
    return null;
  }

  return staticAlev ? renderStaticInlineMdx(source) : renderInlineMdx(source);
}

export default InlineMdx;
