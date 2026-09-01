/**
 * KUNDLI V40.1 — the renderer v3 font stack.
 *
 * Why this file exists
 * --------------------
 * V40 shipped with one unfixable defect: jsPDF has no complex-text layout, so
 * `सिंह` printed as `स` + `ि` + `ं` + `ह` in logical order. The pre-base matra
 * `ि` belongs *before* the consonant it attaches to. No amount of string
 * manipulation fixes that honestly — reordering by hand is a per-language hack
 * that breaks on the next conjunct, and the V40.1 brief forbids it.
 *
 * The fix is to use a text engine that runs the OpenType layout tables. This
 * stack is pdfkit + fontkit: fontkit carries a HarfBuzz-derived Indic shaper
 * that applies GSUB (reordering, conjunct formation, matra substitution) and
 * GPOS (mark positioning) from the font itself. Shaping is therefore a
 * property of the FONT, not of our code, which is exactly the property the
 * brief demands.
 *
 * Font roles
 * ----------
 *   serif*      EB Garamond — running prose, titles. A scholarly book face.
 *   sans*       Noto Sans   — tables, labels, chart glyphs, chrome. Legible at
 *                             7pt where a Garamond x-height is not.
 *   devaSerif*  Noto Serif Devanagari — Devanagari inside serif settings.
 *   devaSans*   Noto Sans Devanagari  — Devanagari inside sans settings.
 *   symbol      DejaVu Sans — the last-resort face, carrying the arrows, ticks,
 *                             primes and mathematical marks the text faces lack.
 *
 * Devanagari follows the FAMILY, not just the script: a Devanagari heading set
 * beside EB Garamond needs a serif Devanagari, and a Devanagari cell in a Noto
 * Sans table needs a sans one. Mixing a sans Devanagari into serif prose is the
 * bilingual equivalent of setting half a sentence in Arial.
 *
 * FONT VERSIONS ARE LOAD-BEARING. Noto Devanagari 2.002 contains NULL anchors
 * in its GPOS mark-attachment table. That is legal OpenType — HarfBuzz skips
 * them — but fontkit dereferences them and throws on `है`, one of the most
 * common words in Hindi. The 2.006 builds vendored here do not. The older
 * files under public/fonts remain in place untouched for renderers v1 and v2.
 *
 * The symbol face is what makes `KUNDLI_INV_RENDER_002` (no .notdef ever
 * reaches the page) enforceable rather than aspirational: any codepoint the
 * chosen face cannot draw is routed to a face that can, and if even DejaVu
 * cannot draw it the renderer throws instead of emitting a box.
 */

import * as fontkit from 'fontkit';

export type FontRole =
  | 'serif' | 'serifBold' | 'serifItalic'
  | 'sans' | 'sansBold'
  | 'devaSerif' | 'devaSerifBold'
  | 'devaSans' | 'devaSansBold'
  | 'symbol';

export const FONT_ROLES: FontRole[] = [
  'serif', 'serifBold', 'serifItalic', 'sans', 'sansBold',
  'devaSerif', 'devaSerifBold', 'devaSans', 'devaSansBold', 'symbol',
];

/** Directory, relative to the project root, holding the renderer-v3 faces. */
export const V3_FONT_DIR = ['public', 'fonts', 'v3'];

/** File name of each role inside `public/fonts/v3`. */
export const FONT_FILES: Record<FontRole, string> = {
  serif: 'EBGaramond-Regular.ttf',
  serifBold: 'EBGaramond-SemiBold.ttf',
  serifItalic: 'EBGaramond-Italic.ttf',
  sans: 'NotoSans-Regular.ttf',
  sansBold: 'NotoSans-SemiBold.ttf',
  devaSerif: 'NotoSerifDevanagari-Regular.ttf',
  devaSerifBold: 'NotoSerifDevanagari-SemiBold.ttf',
  devaSans: 'NotoSansDevanagari-Regular.ttf',
  devaSansBold: 'NotoSansDevanagari-SemiBold.ttf',
  symbol: 'DejaVuSans.ttf',
};

export type FontBinaries = Record<FontRole, Uint8Array>;

/**
 * Loads the eight faces from disk. Node only; the V40.1 renderer is a
 * server-side document generator by design, because deterministic pagination
 * requires deterministic metrics and a browser cannot promise those.
 */
export function loadFontBinaries(fontsDir?: string): FontBinaries {
  // Resolved lazily through `process` so this module stays importable (though
  // unusable) in a bundler graph that also targets the browser.
  const proc = (globalThis as { process?: NodeJS.Process }).process;
  if (!proc?.cwd) {
    throw new Error('KUNDLI_FONT_LOAD_FAILED: renderer v3 requires a Node runtime');
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('node:fs') as typeof import('node:fs');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const path = require('node:path') as typeof import('node:path');
  const dir = fontsDir ?? path.join(proc.cwd(), ...V3_FONT_DIR);

  const out = {} as FontBinaries;
  for (const role of FONT_ROLES) {
    const file = path.join(dir, FONT_FILES[role]);
    if (!fs.existsSync(file)) {
      throw new Error(`KUNDLI_FONT_LOAD_FAILED: missing ${FONT_FILES[role]} in ${dir}`);
    }
    out[role] = new Uint8Array(fs.readFileSync(file));
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Script segmentation                                                 */
/* ------------------------------------------------------------------ */

export type TextFamily = 'serif' | 'sans';

export interface RunStyle {
  family: TextFamily;
  bold?: boolean;
  italic?: boolean;
}

export interface TextRun {
  text: string;
  role: FontRole;
}

const DEVANAGARI = /[\u0900-\u097F\uA8E0-\uA8FF]/;
/** Marks that must never be separated from the cluster they belong to. */
const JOINERS = /[\u200C\u200D\u25CC]/;

function isDevanagariCodePoint(cp: number): boolean {
  return (cp >= 0x0900 && cp <= 0x097f) || (cp >= 0xa8e0 && cp <= 0xa8ff);
}

/** True when the string contains any Devanagari. */
/**
 * True for the four Devanagari faces.
 *
 * Callers use this to suppress letter-spacing. Tracking is a Latin
 * typographic device; Devanagari positions its matras and conjunct marks with
 * GPOS mark attachment, so inserting a fixed advance after every glyph is both
 * typographically wrong and mechanically destructive — see
 * `PdfSurface.trackingPtFor`.
 */
export function isDevanagariRole(role: FontRole): boolean {
  return role === 'devaSerif' || role === 'devaSerifBold'
    || role === 'devaSans' || role === 'devaSansBold';
}

export function hasDevanagari(s: string): boolean {
  return DEVANAGARI.test(s);
}

function latinRole(style: RunStyle): FontRole {
  if (style.family === 'sans') return style.bold ? 'sansBold' : 'sans';
  if (style.italic) return 'serifItalic';
  return style.bold ? 'serifBold' : 'serif';
}

function devanagariRole(style: RunStyle): FontRole {
  if (style.family === 'sans') return style.bold ? 'devaSansBold' : 'devaSans';
  return style.bold ? 'devaSerifBold' : 'devaSerif';
}

/**
 * A coverage-aware font picker.
 *
 * Holds the parsed fontkit objects so the renderer can ask, per codepoint,
 * "can this face actually draw it?" — which is the only reliable way to
 * guarantee no .notdef box reaches the page.
 */
export class FontStack {
  private readonly faces: Record<FontRole, fontkit.FontkitFont>;

  constructor(readonly binaries: FontBinaries) {
    const faces = {} as Record<FontRole, fontkit.FontkitFont>;
    for (const role of FONT_ROLES) {
      faces[role] = fontkit.create(binaries[role]);
    }
    this.faces = faces;
  }

  static fromDisk(fontsDir?: string): FontStack {
    return new FontStack(loadFontBinaries(fontsDir));
  }

  face(role: FontRole): fontkit.FontkitFont {
    return this.faces[role];
  }

  postscriptName(role: FontRole): string {
    return this.faces[role].postscriptName;
  }

  covers(role: FontRole, codePoint: number): boolean {
    return this.faces[role].hasGlyphForCodePoint(codePoint);
  }

  /**
   * Chooses the face for a single codepoint.
   *
   * Order: script first (Devanagari is never drawn by a Latin face, because a
   * Latin face silently yields .notdef for it), then the requested family,
   * then the symbol face. Whitespace is transparent — it inherits whatever the
   * caller was already using so a space never forces a font switch mid-word.
   */
  roleForCodePoint(cp: number, style: RunStyle): FontRole | null {
    if (isDevanagariCodePoint(cp)) {
      const role = devanagariRole(style);
      if (this.covers(role, cp)) return role;
      for (const fallback of ['devaSerif', 'devaSans'] as const) {
        if (this.covers(fallback, cp)) return fallback;
      }
      return null;
    }
    const primary = latinRole(style);
    if (this.covers(primary, cp)) return primary;
    // A bold/italic face may lack a mark its regular sibling has.
    const regular = style.family === 'sans' ? 'sans' : 'serif';
    if (this.covers(regular, cp)) return regular;
    if (this.covers('symbol', cp)) return 'symbol';
    return null;
  }

  /**
   * Splits a string into maximal same-face runs.
   *
   * Each run is handed to pdfkit whole, so fontkit shapes the entire run in
   * one pass and cluster boundaries inside a run are never broken. Runs only
   * split where the FACE changes, which for Devanagari means at a script
   * boundary — never inside a syllable.
   *
   * Throws when a codepoint has no face at all. Failing loudly here is the
   * point: a silent box in a Pandit's chart is worse than a failed build.
   */
  runsFor(text: string, style: RunStyle): TextRun[] {
    const runs: TextRun[] = [];
    let current: TextRun | null = null;
    const unsupported: string[] = [];

    for (const ch of text) {
      const cp = ch.codePointAt(0)!;
      let role: FontRole | null;

      if (/\s/.test(ch)) {
        // Space keeps the current face when there is one; otherwise it is
        // resolved normally so a leading space still has a valid face.
        role = current ? current.role : this.roleForCodePoint(0x20, style);
      } else if (JOINERS.test(ch)) {
        role = current ? current.role : devanagariRole(style);
      } else {
        role = this.roleForCodePoint(cp, style);
      }

      if (role === null) {
        unsupported.push(`U+${cp.toString(16).toUpperCase().padStart(4, '0')}`);
        continue;
      }
      if (current && current.role === role) current.text += ch;
      else {
        current = { text: ch, role };
        runs.push(current);
      }
    }

    if (unsupported.length > 0) {
      throw new Error(
        `KUNDLI_FONT_COVERAGE_MISSING: no embedded face can draw ${[...new Set(unsupported)].join(', ')} ` +
        `(in ${JSON.stringify(text.slice(0, 60))})`,
      );
    }
    return runs;
  }

  /**
   * Reports which codepoints of `text` cannot be drawn, without throwing.
   * Used by the typography validation fixture and by the release gate.
   */
  missingCodePoints(text: string, style: RunStyle): string[] {
    const missing = new Set<string>();
    for (const ch of text) {
      if (/\s/.test(ch) || JOINERS.test(ch)) continue;
      const cp = ch.codePointAt(0)!;
      if (this.roleForCodePoint(cp, style) === null) {
        missing.add(`U+${cp.toString(16).toUpperCase().padStart(4, '0')}`);
      }
    }
    return [...missing];
  }

  /**
   * Shapes a string with the face that would actually draw it and returns the
   * resulting glyph ids. Two independent uses:
   *
   *   - the shaping test asserts that `सिंह` yields the pre-base matra FIRST,
   *     which is the machine-checkable form of "the script is shaped";
   *   - the release gate asserts no glyph id is 0 (.notdef).
   */
  shape(text: string, style: RunStyle): { role: FontRole; glyphIds: number[]; codePoints: number[][] }[] {
    return this.runsFor(text, style).map((run) => {
      const layout = this.faces[run.role].layout(run.text);
      return {
        role: run.role,
        glyphIds: layout.glyphs.map((g) => g.id),
        codePoints: layout.glyphs.map((g) => g.codePoints),
      };
    });
  }
}
