import type { FC } from "react";

import { renderAlevContent } from "@/lib/alev";

import alevTextStyles from "./AlevText.module.css";
import styles from "./LayeredGlyph.module.css";

type LayeredGlyphProps = {
  glyph: string;
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

  return (
    <figure className={styles.layeredGlyphFigure}>
      <div
        className={`${styles.layeredGlyphStack} ${alevTextStyles.glyphText}`}
        aria-hidden="true"
      >
        <span className={styles.layeredGlyphBackdrop}>
          {renderAlevContent("0xFF")}
        </span>
        <span className={styles.layeredGlyphForeground}>
          {renderAlevContent(`0b${binary}`)}
        </span>
      </div>
      <figcaption className={styles.layeredGlyphLabel}>{binary}</figcaption>
    </figure>
  );
};

export default LayeredGlyph;
