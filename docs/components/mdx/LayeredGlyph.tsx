import type { FC } from "react";

import { normalizeAlevToken } from "@alev/data";

import { loadSourceData } from "@/lib/source-data";

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
  const {
    keywordMap,
  } = loadSourceData();

  return (
    <figure className={styles.layeredGlyphFigure}>
      <div
        className={`${styles.layeredGlyphStack} ${alevTextStyles.glyphText}`}
        aria-hidden="true"
      >
        <span className={styles.layeredGlyphBackdrop}>
          {normalizeAlevToken("0xFF", keywordMap)}
        </span>
        <span className={styles.layeredGlyphForeground}>
          {normalizeAlevToken(`0b${binary}`, keywordMap)}
        </span>
      </div>
      <figcaption className={styles.layeredGlyphLabel}>{binary}</figcaption>
    </figure>
  );
};

export default LayeredGlyph;
