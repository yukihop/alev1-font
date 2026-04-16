import { renderInlineMdx } from '@/lib/mdx';

type InlineMdxProps = {
  source?: string | null;
};

async function InlineMdx(props: InlineMdxProps) {
  const { source } = props;
  if (!source) {
    return null;
  }

  return renderInlineMdx(source);
}

export default InlineMdx;
