from __future__ import annotations

import sys
from pathlib import Path

from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: python merge_ascii_from_donor.py TARGET.ttf DONOR.ttf", file=sys.stderr)
        return 1

    target_path = Path(sys.argv[1])
    donor_path = Path(sys.argv[2])

    target_font = TTFont(target_path)
    donor_font = TTFont(donor_path)

    target_cmap = target_font.getBestCmap() or {}
    donor_cmap = donor_font.getBestCmap() or {}
    donor_glyph_set = donor_font.getGlyphSet()
    donor_hmtx = donor_font["hmtx"]
    target_glyf = target_font["glyf"]
    target_hmtx = target_font["hmtx"]

    target_upem = target_font["head"].unitsPerEm
    donor_upem = donor_font["head"].unitsPerEm
    scale = target_upem / donor_upem

    merged_count = 0
    missing = []

    for codepoint in range(0x20, 0x7F):
        target_name = target_cmap.get(codepoint)
        if target_name is None:
            continue

        donor_name = donor_cmap.get(codepoint)
        if donor_name is None:
            missing.append(codepoint)
            continue

        recording_pen = DecomposingRecordingPen(donor_glyph_set)
        donor_glyph_set[donor_name].draw(recording_pen)

        glyph_pen = TTGlyphPen(None)
        transform_pen = TransformPen(glyph_pen, (scale, 0, 0, scale, 0, 0))
        recording_pen.replay(transform_pen)

        target_glyf[target_name] = glyph_pen.glyph()

        advance_width, left_side_bearing = donor_hmtx.metrics[donor_name]
        target_hmtx.metrics[target_name] = (round(advance_width * scale), round(left_side_bearing * scale))
        merged_count += 1

    if missing:
        labels = ", ".join(f"U+{codepoint:04X}" for codepoint in missing[:8])
        suffix = "..." if len(missing) > 8 else ""
        print(f"warning: donor font missing {len(missing)} glyph(s): {labels}{suffix}", file=sys.stderr)

    if merged_count == 0:
        print("no ASCII glyphs were merged from donor font", file=sys.stderr)
        return 1

    target_font.save(target_path)
    print(f"merged {merged_count} ASCII glyphs from {donor_path.name} into {target_path.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
