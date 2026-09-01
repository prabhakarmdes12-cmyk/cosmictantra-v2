/**
 * KUNDLI V40.1 — design tokens for renderer v3.
 *
 * V40's tokens were written for jsPDF's built-in Helvetica. Renderer v3 embeds
 * a real book face, so the type scale, the leading and the palette are
 * re-stated here rather than mutated in place: `tokens.ts` must keep producing
 * a byte-comparable v2 artifact for as long as v2 is the regression reference.
 *
 * Design brief, restated as constraints:
 *   - a traditional scholarly document, not an admin dashboard;
 *   - restrained luxury: one accent colour, hairline rules, generous margins,
 *     no cards, no shadows, no gradients, no decorative iconography;
 *   - every status is a drawn SHAPE first and a colour second, so the document
 *     survives a black-and-white photocopy in a consultation room;
 *   - nothing smaller than 7pt, ever.
 *
 * LEADING. Devanagari needs more vertical room than Latin: Noto Sans
 * Devanagari descends to -0.408em (matras such as ु and ृ) while Noto Sans
 * ascends to 1.069em. A line box must therefore be at least 1.477em to avoid
 * clipping either. Every leading value below satisfies that for its size —
 * this is why v3 leading is looser than v2's, and it is not a style choice.
 */

import { KundliPdfTokens as V2 } from './tokens';

export type Rgb = readonly [number, number, number];

/**
 * Baseline offset from the top of a text box, in em.
 *
 * Constant across faces on purpose: a table row containing a Latin cell and a
 * Devanagari cell must sit on ONE baseline, so the offset cannot depend on the
 * content of the cell.
 */
export const BASELINE_EM = 1.02;
/** Minimum line box, in em, that clears the tallest ascender and deepest matra. */
export const MIN_LEADING_EM = 1.48;

export const V3 = {
  page: {
    widthMm: 210,
    heightMm: 297,
    marginTopMm: 20,
    marginBottomMm: 20,
    marginLeftMm: 18,
    marginRightMm: 18,
    contentBottomMm: 274,
    footerBaselineMm: 285,
    headerBaselineMm: 13.5,
  },

  spacing: {
    /** Body leading. 9.7pt x 1.48 = 14.4pt = 5.06mm. */
    lineMm: 5.1,
    /** Small / table leading. 8.4pt x 1.48 = 12.4pt = 4.39mm. */
    tightLineMm: 4.4,
    /** Micro leading. 7.2pt x 1.48 = 10.7pt = 3.76mm. */
    microLineMm: 3.8,
    blockGapMm: 3.4,
    sectionGapMm: 7.0,
    headingGapMm: 3.0,
    tableCellPadMm: 1.8,
    tableRowMinMm: 6.4,
  },

  typography: {
    sizes: {
      coverTitle: 27,
      coverSubtitle: 13,
      coverName: 20,
      coverMeta: 10.5,
      sectionTitle: 15.5,
      h2: 12,
      h3: 10,
      body: 9.7,
      small: 8.4,
      table: 8.2,
      tableHeader: 7.2,
      micro: 7.2,
      footer: 7,
    },
    minimumSizePt: 7,
    /** Tracking for the small uppercase labels that carry the scholarly tone. */
    smallCapsTrackingMm: 0.34,
    /** Tighter, because table headers live in narrow columns. */
    tableHeaderTrackingMm: 0.12,
  },

  colors: {
    ink: [34, 30, 26] as Rgb,
    inkSoft: [88, 82, 74] as Rgb,
    inkFaint: [138, 131, 121] as Rgb,
    parchment: [252, 250, 245] as Rgb,
    parchmentDeep: [247, 243, 234] as Rgb,
    vermilion: [130, 28, 26] as Rgb,
    vermilionSoft: [166, 78, 62] as Rgb,
    gold: [150, 122, 58] as Rgb,
    goldFaint: [216, 200, 158] as Rgb,
    rule: [198, 189, 172] as Rgb,
    ruleFaint: [228, 221, 208] as Rgb,
    tableHeaderRule: [150, 122, 58] as Rgb,
    tableZebra: [249, 246, 239] as Rgb,
    highlightFill: [246, 237, 216] as Rgb,
    calloutInfo: [248, 246, 240] as Rgb,
    calloutWarn: [251, 243, 237] as Rgb,
    notesRule: [212, 205, 191] as Rgb,
  },

  heading: {
    sectionRuleWidthMm: 0.5,
    /** A heading may never be the last thing on a page. */
    minLinesAfterHeadingMm: 14,
  },

  rule: {
    hairlineMm: 0.15,
    lightMm: 0.28,
    heavyMm: 0.5,
  },

  motif: {
    widthMm: 56,
    cornerMarkMm: 7,
  },

  chart: {
    /** Sized so the folded placement table still fits beneath it. */
    heroSizeMm: 128,
    inlineSizeMm: 96,
    baseFontSize: 8.8,
    minFontSize: 6.4,
    captionSize: 7.4,
    /** Grey levels handed to the shared chart module; see rendererV3. */
    palette: { stroke: 96, text: 34, lagna: 34, muted: 140 },
    /** A 1.6mm bar reads as a printing fault at this type colour. */
    lagnaMarkerWidthMm: 0.9,
  },

  /** Status vocabulary. Glyph is documentary; the renderer DRAWS the shape. */
  status: V2.status,
} as const;

export const contentWidthMmV3 = V3.page.widthMm - V3.page.marginLeftMm - V3.page.marginRightMm;

export type V3Tokens = typeof V3;
