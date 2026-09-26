import type { FC } from "react";

import { glyphCharForBinary } from "@/lib/alev-shared";

import alevTextStyles from "./AlevText.module.css";
import styles from "./LayeredGlyph.module.css";

type LayeredGlyphProps = {
  glyph: string;
  /** Per-bit color keys aligned with the binary, e.g. "-r--gb--" */
  bitColors?: string;
};

function normalizeGlyph(value: string): string {
  const binary = String(value ?? "")
    .trim()
    .replace(/^0b/i, "");

  if (!/^[01]{8}$/.test(binary)) {
    throw new Error(
      `LayeredGlyph expected an 8-bit binary string, received "${value}".`,
    );
  }

  return binary;
}

const LayeredGlyph: FC<LayeredGlyphProps> = (props) => {
  const binary = normalizeGlyph(props.glyph);
  const bits = [...binary];
  const colorClass = (index: number): string | undefined =>
    styles[`bitColor-${props.bitColors?.[index]}`];

  return (
    <figure className={styles.layeredGlyphFigure}>
      <div
        className={`${styles.layeredGlyphStack} ${alevTextStyles.glyphText}`}
        aria-hidden="true"
      >
        <span className={styles.layeredGlyphBackdrop}>
          {glyphCharForBinary("11111111")}
        </span>
        {bits.map((bit, index) =>
          bit === "1" ? (
            <span
              key={index}
              className={`${styles.layeredGlyphForeground} ${colorClass(index) ?? ""}`}
            >
              {glyphCharForBinary(
                "0".repeat(index) + "1".padEnd(8 - index, "0"),
              )}
            </span>
          ) : null,
        )}
      </div>
      <figcaption className={styles.layeredGlyphLabel}>
        {bits.map((bit, index) => (
          <span
            key={index}
            className={bit === "1" ? colorClass(index) : undefined}
          >
            {bit}
          </span>
        ))}
      </figcaption>
    </figure>
  );
};

export default LayeredGlyph;
