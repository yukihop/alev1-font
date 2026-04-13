from __future__ import annotations

import sys
from pathlib import Path

from fontTools.ttLib import TTFont


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: python ttf_to_woff2.py INPUT.ttf OUTPUT.woff2", file=sys.stderr)
        return 1

    source = Path(sys.argv[1])
    target = Path(sys.argv[2])

    font = TTFont(source)
    font.flavor = "woff2"
    font.save(target)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
