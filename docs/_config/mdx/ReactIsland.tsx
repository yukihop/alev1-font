import { type FC, type ReactNode } from 'react';

type ReactIslandProps = {
  component: string;
  props: Record<string, unknown>;
  children: ReactNode;
};

const ReactIsland: FC<ReactIslandProps> = props => {
  const { component, props: islandProps, children } = props;

  return (
    <div
      data-react-island={component}
      data-react-props={JSON.stringify(islandProps)}
    >
      {children}
    </div>
  );
};

export default ReactIsland;
