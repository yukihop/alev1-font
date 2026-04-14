import glyphData from "./generated/alev-glyph-data.ts";
import { z } from "zod";

type AlevSvgProps = {
  text: string;
  fontSize?: number | string;
  letterSpacing?: number | string;
  color?: string;
  shadowColor?: string | null | undefined;
};

type GlyphElement = {
  tagName: string;
  attributes: Record<string, string>;
};

type GlyphShape = {
  width: number;
  viewBox: {
    minX: number;
    minY: number;
    width: number;
    height: number;
  };
  elements: GlyphElement[];
};

type ParsedGlyph =
  | { kind: "space"; width: number }
  | { kind: "shape"; width: number; shapes: GlyphShape[] };

const partOrder = [
  { name: "part1", bit: 0x80 },
  { name: "part2", bit: 0x40 },
  { name: "part3", bit: 0x20 },
  { name: "part4", bit: 0x10 },
  { name: "part5", bit: 0x08 },
  { name: "part6", bit: 0x04 },
  { name: "part7", bit: 0x02 },
  { name: "part8", bit: 0x01 },
] as const;

const formatNumber = (value: number): string =>
  Number.isInteger(value)
    ? String(value)
    : value.toFixed(3).replace(/\.?0+$/, "");

const escapeXml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const emHeight = glyphData.ascender - glyphData.descender;
const lineAdvance = glyphData.unitsPerEm * 1.45;
const innerGlow = glyphData.unitsPerEm * 0.055;
const outerGlow = glyphData.unitsPerEm * 0.18;
const padding = Math.ceil(outerGlow * 3.5);

const alevSvgPropsSchema = z.object({
  text: z
    .string()
    .transform((value) => value.toLowerCase())
    .refine((value) => /^([0-9a-f]{2}|\[|\]| |\n)+$/.test(value), {
      message: "テキストの形式が不正です",
    })
    .refine((value) => value.split("\n").length <= 5, {
      message: "行数は5行以内にしてください",
    })
    .refine((value) => value.split("\n").every((line) => line.length <= 100), {
      message: "1行は100文字以内にしてください",
    }),
  fontSize: z.preprocess(
    (value) => (value === undefined || value === "" ? 36 : value),
    z.coerce
      .number()
      .gte(9, "フォントサイズは9pt以上にしてください")
      .lte(220, "フォントサイズは220pt以下にしてください"),
  ),
  letterSpacing: z.preprocess(
    (value) => (value === undefined || value === "" ? 0 : value),
    z.coerce
      .number()
      .int("レタースペーシングは整数で指定してください")
      .gte(-200, "レタースペーシングは-200以上にしてください")
      .lte(400, "レタースペーシングは400以下にしてください"),
  ),
  color: z.preprocess(
    (value) => (value === undefined || value === "" ? "#000000" : value),
    z.string().regex(/^#[0-9a-f]{6}$/i, "文字色は #rrggbb 形式で指定してください"),
  ),
  shadowColor: z.preprocess(
    (value) =>
      value === undefined || value === null || value === "" ? null : value,
    z.union([
      z.null(),
      z
        .string()
        .regex(/^#[0-9a-f]{6}$/i, "影色は #rrggbb 形式で指定してください"),
    ]),
  ),
});

const normalizeAlevSvgProps = (props: AlevSvgProps) => {
  return alevSvgPropsSchema.parse(props);
};

const renderElement = (element: GlyphElement, color: string): string => {
  if (element.tagName !== "path" && element.tagName !== "polygon") {
    throw new Error(`Unsupported SVG element: ${element.tagName}`);
  }

  const attrs = Object.entries(element.attributes)
    .map(([name, value]) => `${name}="${escapeXml(value)}"`)
    .join(" ");
  const attrPrefix = attrs ? `${attrs} ` : "";
  return `<${element.tagName} ${attrPrefix}fill="${escapeXml(color)}"/>`;
};

const renderShape = (shape: GlyphShape, color: string): string => {
  const scaleX = shape.width / shape.viewBox.width;
  const scaleY = glyphData.unitsPerEm / shape.viewBox.height;
  const transforms = [];

  if (scaleX !== 1 || scaleY !== 1) {
    transforms.push(`scale(${formatNumber(scaleX)} ${formatNumber(scaleY)})`);
  }

  if (shape.viewBox.minX !== 0 || shape.viewBox.minY !== 0) {
    transforms.push(
      `translate(${formatNumber(-shape.viewBox.minX)} ${formatNumber(-shape.viewBox.minY)})`,
    );
  }

  const contents = shape.elements
    .map((element) => renderElement(element, color))
    .join("");
  return transforms.length > 0
    ? `<g transform="${transforms.join(" ")}">${contents}</g>`
    : contents;
};

const parseCanonicalLine = (text: string): ParsedGlyph[] => {
  const value = String(text ?? "");
  const glyphs: ParsedGlyph[] = [];

  for (let index = 0; index < value.length; ) {
    const char = value[index];

    if (char === " ") {
      glyphs.push({ kind: "space", width: glyphData.spaceWidth });
      index += 1;
      continue;
    }

    if (char === "[") {
      glyphs.push({
        kind: "shape",
        width: glyphData.brackets.open.width,
        shapes: [glyphData.brackets.open],
      });
      index += 1;
      continue;
    }

    if (char === "]") {
      glyphs.push({
        kind: "shape",
        width: glyphData.brackets.close.width,
        shapes: [glyphData.brackets.close],
      });
      index += 1;
      continue;
    }

    const hex = value.slice(index, index + 2);
    if (!/^[0-9a-f]{2}$/i.test(hex)) {
      throw new Error(`Invalid canonical text at offset ${index}.`);
    }

    const mask = Number.parseInt(hex, 16);
    glyphs.push({
      kind: "shape",
      width: glyphData.advanceWidth,
      shapes: partOrder
        .filter((part) => (mask & part.bit) !== 0)
        .map((part) => glyphData.parts[part.name]),
    });
    index += 2;
  }

  return glyphs;
};

export function generateAlevSvg(props: AlevSvgProps): string {
  const { text, fontSize, letterSpacing, color, shadowColor } =
    normalizeAlevSvgProps(props);
  const lines = text.split("\n").map((line) => parseCanonicalLine(line));
  const tracking = (letterSpacing / 1000) * glyphData.unitsPerEm;
  const nodes: string[] = [];
  let contentWidth = 1;

  lines.forEach((glyphs, lineIndex) => {
    let cursorX = 0;

    glyphs.forEach((glyph, index) => {
      if (glyph.kind === "shape") {
        const contents = glyph.shapes
          .map((shape) => renderShape(shape, color))
          .join("");
        nodes.push(
          `<g transform="translate(${formatNumber(cursorX + padding)} ${formatNumber(padding + lineIndex * lineAdvance)})">${contents}</g>`,
        );
      }

      cursorX += glyph.width;
      if (index < glyphs.length - 1) {
        cursorX += tracking;
      }
    });

    contentWidth = Math.max(contentWidth, cursorX);
  });

  const svgWidth = contentWidth + padding * 2;
  const contentHeight = emHeight + Math.max(lines.length - 1, 0) * lineAdvance;
  const svgHeight = contentHeight + padding * 2;
  const widthPt = (svgWidth / glyphData.unitsPerEm) * fontSize;
  const heightPt = (svgHeight / glyphData.unitsPerEm) * fontSize;
  const filterMarkup = shadowColor
    ? [
        "<defs>",
        `  <filter id="alev-glow" x="0" y="0" width="${formatNumber(svgWidth)}" height="${formatNumber(svgHeight)}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">`,
        `    <feDropShadow in="SourceGraphic" dx="0" dy="0" stdDeviation="${formatNumber(innerGlow)}" flood-color="${escapeXml(shadowColor)}" flood-opacity="0.9" result="glowNear"/>`,
        `    <feDropShadow in="SourceGraphic" dx="0" dy="0" stdDeviation="${formatNumber(outerGlow)}" flood-color="${escapeXml(shadowColor)}" flood-opacity="0.45" result="glowFar"/>`,
        "    <feMerge>",
        '      <feMergeNode in="glowFar"/>',
        '      <feMergeNode in="glowNear"/>',
        '      <feMergeNode in="SourceGraphic"/>',
        "    </feMerge>",
        "  </filter>",
        "</defs>",
      ].join("\n")
    : "";
  const body = shadowColor
    ? `<g filter="url(#alev-glow)">\n${nodes.join("\n")}\n</g>`
    : nodes.join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${formatNumber(widthPt)}pt" height="${formatNumber(heightPt)}pt" viewBox="0 0 ${formatNumber(svgWidth)} ${formatNumber(svgHeight)}" role="img" aria-label="ALEV SVG">`,
    filterMarkup,
    body,
    "</svg>",
    "",
  ]
    .filter(Boolean)
    .join("\n");
}
