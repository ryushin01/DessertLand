#!/usr/bin/env python3
"""Flaticon UIcons(Regular Rounded)에서 쓰는 아이콘만 추려 CSS와 woff2를 만듭니다.
사용법: python scripts/build-icons.py <패키지 css 폴더> (fonttools, brotli 필요)"""
import base64, glob, io, re, sys
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

ICONS = "shopping-bag cross plus minus arrow-right arrow-down arrow-up-right globe pause play trash check marker".split()
css_dir = Path(sys.argv[1])
css = (css_dir / "regular/rounded.css").read_text()
codes = {}
for name in ICONS:
    m = re.search(r"\.fi-rr-%s:before\s*\{\s*content:\s*\"\\([0-9a-fA-F]+)\"" % re.escape(name), css)
    if not m:
        sys.exit(f"missing icon: {name}")
    codes[name] = int(m.group(1), 16)
font = TTFont(glob.glob(str(css_dir / "uicons-regular-rounded-*.woff2"))[0])
opts = subset.Options(); opts.flavor = "woff2"; opts.layout_features = []; opts.notdef_outline = True
s = subset.Subsetter(opts); s.populate(unicodes=list(codes.values())); s.subset(font)
font.flavor = "woff2"
out = Path(__file__).resolve().parent.parent / "src/shared/ui/icon"
font.save(out / "uicons-subset.woff2")
rules = "\n".join(f'.fi-{n}::before {{ content: "\\{c:x}"; }}' for n, c in codes.items())
(out / "uicons-subset.css").write_text(
    "/* Uicons by Flaticon (https://www.flaticon.com/uicons) - scripts/build-icons.py로 생성 */\n"
    '@font-face { font-family: "uicons-subset"; src: url("./uicons-subset.woff2") format("woff2"); font-display: block; }\n'
    '.fi { display: inline-block; font-family: "uicons-subset"; font-style: normal; font-weight: 400; line-height: 1; -webkit-font-smoothing: antialiased; }\n'
    + rules + "\n")
(out / "icon-names.ts").write_text("export const ICON_NAMES = [\n" + "".join(f'  "{n}",\n' for n in codes) + "] as const;\n\nexport type IconName = (typeof ICON_NAMES)[number];\n")
print(codes)
