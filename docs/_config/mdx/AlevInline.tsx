import { Children, type FC, type ReactNode } from "react";

import { renderAlevContent } from "../alev.ts";

type AlevInlineProps = {
  source?: string;
  children?: ReactNode;
};

const textFromChildren = (children: ReactNode): string =>
  Children.toArray(children)
    .map((child) => {
      if (typeof child === "string") return child;
      if (typeof child === "number") return String(child);
      return "";
    })
    .join(" ");

const AlevInline: FC<AlevInlineProps> = (props) => {
  const { source = "", children } = props;
  const text = source || textFromChildren(children);

  return (
    <span className="alev-inline" title={text}>
      {renderAlevContent(text)}
    </span>
  );
};

export default AlevInline;
