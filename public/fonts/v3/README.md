# Renderer v3 font set

These are the faces embedded (as subsets) by `kundli-pdf-renderer-v3`. They are
vendored rather than fetched at build time so that a report generated today and
the same report generated in five years are byte-comparable.

| File | Family | Role | Licence |
| --- | --- | --- | --- |
| `EBGaramond-Regular.ttf` | EB Garamond | serif body and titles | SIL OFL 1.1 |
| `EBGaramond-SemiBold.ttf` | EB Garamond | serif emphasis | SIL OFL 1.1 |
| `EBGaramond-Italic.ttf` | EB Garamond | serif italic | SIL OFL 1.1 |
| `NotoSans-Regular.ttf` | Noto Sans | tables, labels, chrome | SIL OFL 1.1 |
| `NotoSans-SemiBold.ttf` | Noto Sans | table and label emphasis | SIL OFL 1.1 |
| `NotoSerifDevanagari-Regular.ttf` | Noto Serif Devanagari | Devanagari in serif settings | SIL OFL 1.1 |
| `NotoSerifDevanagari-SemiBold.ttf` | Noto Serif Devanagari | Devanagari serif emphasis | SIL OFL 1.1 |
| `NotoSansDevanagari-Regular.ttf` | Noto Sans Devanagari | Devanagari in sans settings | SIL OFL 1.1 |
| `NotoSansDevanagari-SemiBold.ttf` | Noto Sans Devanagari | Devanagari sans emphasis | SIL OFL 1.1 |
| `DejaVuSans.ttf` | DejaVu Sans | symbol fallback of last resort | Bitstream Vera / Arev (permissive) |

`../OFL.txt` carries the SIL Open Font License 1.1 text that applies to every
Noto and EB Garamond file above.

## Two things that are load-bearing, not incidental

**Devanagari version.** These Noto Devanagari builds are 2.006. Version 2.002
(still present at `../NotoSansDevanagari-*.ttf` for renderers v1 and v2)
contains NULL anchors in its GPOS mark-attachment table. A NULL anchor is legal
OpenType and HarfBuzz simply skips it, but fontkit dereferences it and throws
while shaping `है` — one of the most common words in Hindi. Do not downgrade.

**The symbol face.** EB Garamond and Noto Sans cover `°`, `′` and `″` but not
`→`, `≥`, `✓` or `✗`. Rather than substituting a lookalike or dropping the
character, the renderer routes any codepoint its chosen face cannot draw to
DejaVu Sans, and raises if even DejaVu cannot draw it. That is what makes
"no .notdef box ever reaches the page" a checkable claim rather than a hope.

## Regenerating

The Latin and Devanagari faces are converted from the `@fontsource/*` WOFF2
packages with fontTools:

```py
from fontTools.ttLib import TTFont
f = TTFont('node_modules/@fontsource/eb-garamond/files/eb-garamond-latin-400-normal.woff2')
f.flavor = None
f.save('public/fonts/v3/EBGaramond-Regular.ttf')
```
