import type { FC, ReactNode } from "react";

import alevTextStyles from "./AlevText.module.css";
import styles from "./Alert.module.css";

const backgroundText = ":interrogative: :you: :seek: :not: :error:";

const Alert: FC<{
  children: ReactNode;
}> = (props) => {
  const { children } = props;
  return (
    <aside className={styles.alert}>
      <span
        className={`${styles.backgroundText} ${alevTextStyles.glyphText}`}
        aria-hidden="true"
      >
        {backgroundText}
      </span>
      <div className={styles.content}>{children}</div>
    </aside>
  );
};

export default Alert;
