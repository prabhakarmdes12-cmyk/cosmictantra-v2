/**
 * KUNDLI V40 — PDF design tokens (§31).
 *
 * One place where every measurement, size and colour in the V40 PDF is
 * declared. Renderers read tokens; they never carry magic numbers.
 *
 * Print rules baked in:
 *   - A4, generous margins, one baseline unit;
 *   - body text never below 8pt, table text never below 7.5pt;
 *   - status is carried by a GLYPH, never by colour alone;
 *   - the palette is restrained ivory / vermilion / antique gold and stays
 *     legible when printed in black and white.
 */

export type Rgb = [number, number, number];

export const KundliPdfTokens = {
  page: {
    format: 'a4' as const,
    widthMm: 210,
    heightMm: 297,
    marginTopMm: 18,
    marginBottomMm: 18,
    marginLeftMm: 16,
    marginRightMm: 16,
    /** Last y a block may occupy before the footer band. */
    contentBottomMm: 277,
    footerBaselineMm: 286,
    headerBaselineMm: 12,
  },

  spacing: {
    /** Vertical rhythm unit. Every block height is a multiple of this. */
    baselineMm: 1.2,
    lineMm: 4.4,
    tightLineMm: 3.8,
    blockGapMm: 3.0,
    sectionGapMm: 7.0,
    headingGapMm: 2.6,
    tableCellPadMm: 1.6,
    tableRowMinMm: 6.0,
  },

  typography: {
    latinRegular: 'helvetica',
    latinBold: 'helvetica',
    devanagariRegular: 'devanagari',
    devanagariBold: 'devanagari-bold',
    sizes: {
      coverTitle: 26,
      coverSubtitle: 15,
      coverName: 21,
      coverMeta: 10.5,
      sectionTitle: 15,
      h2: 12,
      h3: 10,
      body: 9.5,
      small: 8.4,
      table: 8.2,
      tableHeader: 8.2,
      micro: 7.2,
      footer: 7,
    },
    /** No text in the document may be smaller than this. */
    minimumSizePt: 7,
  },

  colors: {
    ink: [38, 34, 30] as Rgb,          // near-black warm
    inkSoft: [92, 86, 78] as Rgb,
    inkFaint: [140, 133, 124] as Rgb,
    parchment: [252, 249, 242] as Rgb, // ivory page tint
    parchmentDeep: [246, 240, 228] as Rgb,
    vermilion: [138, 30, 28] as Rgb,   // restrained deep maroon-vermilion
    vermilionSoft: [176, 84, 68] as Rgb,
    gold: [158, 128, 62] as Rgb,       // muted antique gold
    goldFaint: [214, 196, 152] as Rgb,
    rule: [196, 186, 168] as Rgb,
    ruleFaint: [226, 219, 205] as Rgb,
    tableHeaderFill: [243, 237, 224] as Rgb,
    tableZebra: [250, 247, 240] as Rgb,
    highlightFill: [246, 235, 210] as Rgb,
    calloutInfo: [244, 243, 236] as Rgb,
    calloutWarn: [250, 240, 234] as Rgb,
    notesRule: [214, 208, 195] as Rgb,
  },

  heading: {
    sectionRuleWidthMm: 0.6,
    sectionRuleInsetMm: 0,
    /** A heading may never be the last thing on a page. */
    minLinesAfterHeadingMm: 12,
  },

  table: {
    headerRepeat: true,
    zebra: true,
    borderWidthMm: 0.15,
    /** Rows are never split across pages. */
    keepRowTogether: true,
  },

  rule: {
    hairlineMm: 0.15,
    lightMm: 0.25,
    heavyMm: 0.5,
  },

  sacredAccent: {
    /** Thin geometric motif height on the cover and part dividers. */
    motifHeightMm: 8,
    motifWidthMm: 60,
    cornerMarkMm: 6,
  },

  chart: {
    heroSizeMm: 132,
    inlineSizeMm: 92,
    baseFontSize: 9,
    minFontSize: 6.2,
    captionSize: 7.4,
  },

  status: {
    /** Glyph-first, colour-second. Black-and-white safe. */
    present: { glyph: '\u2713', label: 'PRESENT' },
    absent: { glyph: '\u2717', label: 'ABSENT' },
    scholar: { glyph: '\u25C7', label: 'SCHOLAR JUDGEMENT' },
    notCalculated: { glyph: '\u2014', label: 'NOT CALCULATED' },
    pending: { glyph: '\u25CB', label: 'VALIDATION PENDING' },
  },
} as const;

export type KundliPdfTokensType = typeof KundliPdfTokens;

/** Usable content width in millimetres. */
export const contentWidthMm =
  KundliPdfTokens.page.widthMm - KundliPdfTokens.page.marginLeftMm - KundliPdfTokens.page.marginRightMm;
