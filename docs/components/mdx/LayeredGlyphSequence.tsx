import type { FC } from "react";

import LayeredGlyph from "./LayeredGlyph";
import styles from "./LayeredGlyphSequence.module.css";

type LayeredGlyphSequenceProps = {
  items: string[];
  layout?: "equation" | "grid";
  bitColors?: string;
};

const isGlyphToken = (value: string): boolean =>
  /^(?:0b)?[01]{8}$/i.test(String(value ?? "").trim());

const LayeredGlyphSequence: FC<LayeredGlyphSequenceProps> = (props) => {
  const { items, layout = "grid", bitColors } = props;

  return (
    <div
      className={
        layout === "equation"
          ? `${styles.sequence} ${styles.equation}`.trim()
          : `${styles.sequence} ${styles.grid}`.trim()
      }
    >
      {items.map((item, index) =>
        isGlyphToken(item) ? (
          <LayeredGlyph
            key={`${layout}-${item}-${index}`}
            glyph={item}
            bitColors={bitColors}
          />
        ) : (
          <span key={`${layout}-${item}-${index}`} className={styles.operator}>
            {item}
          </span>
        ),
      )}
    </div>
  );
};

export default LayeredGlyphSequence;
