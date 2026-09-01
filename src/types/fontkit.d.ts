/**
 * Minimal ambient types for `fontkit` (v2 ships no declarations).
 *
 * Only the surface the V40.1 renderer actually uses is declared. Keeping this
 * narrow is deliberate: an over-broad `any` shim would hide the very mistakes
 * (missing glyph, unsupported script) this renderer exists to prevent.
 */
declare module 'fontkit' {
  export interface FontkitGlyph {
    id: number;
    codePoints: number[];
    advanceWidth: number;
  }

  export interface FontkitGlyphRun {
    glyphs: FontkitGlyph[];
    positions: { xAdvance: number; yAdvance: number; xOffset: number; yOffset: number }[];
    advanceWidth: number;
  }

  export interface FontkitFont {
    postscriptName: string;
    familyName: string;
    unitsPerEm: number;
    ascent: number;
    descent: number;
    lineGap: number;
    capHeight: number;
    xHeight: number;
    hasGlyphForCodePoint(codePoint: number): boolean;
    layout(text: string, features?: string[] | Record<string, boolean>): FontkitGlyphRun;
    glyphsForString(text: string): FontkitGlyph[];
  }

  export function openSync(path: string, postscriptName?: string): FontkitFont;
  export function create(buffer: Uint8Array, postscriptName?: string): FontkitFont;
}
