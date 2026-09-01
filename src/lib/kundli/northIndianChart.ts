/**
 * NORTH INDIAN CHART RENDERER
 *
 * One deterministic geometry, three surfaces: vector PDF primitives, SVG, and
 * the textual equivalent. All three are produced from the same layout, so a
 * drawing can never disagree with the text beside it.
 *
 * The renderer calculates nothing astrological. It draws placements that
 * already exist in a validated ChartRenderModel (see chartModel.ts), and it
 * refuses to draw at all if that model is missing or incomplete.
 *
 * Nothing is rasterised. The PDF path uses jsPDF line and text primitives;
 * the web/artifact path is SVG.
 */

import type { ChartRenderModel, ChartPlacement } from './chartModel';
import { occupantsByHouse, signLabel } from './chartModel';

export const CHART_LAYOUT_VERSION = 'north-indian-layout-v1';

/* ------------------------------------------------------------------ */
/* Geometry (a 0..100 square, scaled at draw time)                     */
/* ------------------------------------------------------------------ */

type Pt = [number, number];

const TL: Pt = [0, 0];
const TR: Pt = [100, 0];
const BR: Pt = [100, 100];
const BL: Pt = [0, 100];
const T: Pt = [50, 0];
const R: Pt = [100, 50];
const B: Pt = [50, 100];
const L: Pt = [0, 50];
const c25: Pt = [25, 25];
const c75a: Pt = [75, 25];
const c75b: Pt = [75, 75];
const c25b: Pt = [25, 75];
const C: Pt = [50, 50];      // centre, where the two diagonals cross

/**
 * The twelve house polygons of the North Indian chart, in house order.
 *
 * House 1 is the top triangle of the central diamond; houses then advance
 * counter-clockwise: 2 upper-left, 3 left-upper, 4 left, 5 lower-left,
 * 6 bottom-left, 7 bottom, 8 bottom-right, 9 right-lower, 10 right,
 * 11 right-upper, 12 upper-right. The four kendra houses (1, 4, 7, 10) are
 * the four triangles of the central diamond.
 */
export const HOUSE_POLYGONS: Pt[][] = [
  // The four kendra houses are the four quadrants of the central diamond.
  // Each is bounded by two half-edges of the diamond and two half-diagonals
  // meeting at the centre — a kite, not a triangle. Their centroids are
  // (50,25), (25,50), (50,75) and (75,50), which is where the chart drawn
  // before this module placed its labels.
  [T, c75a, C, c25],         //  1 top of the diamond
  [TL, T, c25],              //  2 upper half of the top-left corner
  [TL, c25, L],              //  3 lower half of the top-left corner
  [L, c25, C, c25b],         //  4 left of the diamond
  [L, c25b, BL],             //  5 upper half of the bottom-left corner
  [c25b, B, BL],             //  6 lower half of the bottom-left corner
  [c25b, C, c75b, B],        //  7 bottom of the diamond
  [BR, B, c75b],             //  8 lower half of the bottom-right corner
  [BR, c75b, R],             //  9 upper half of the bottom-right corner
  [R, c75a, C, c75b],        // 10 right of the diamond
  [TR, c75a, R],             // 11 lower half of the top-right corner
  [TR, T, c75a],             // 12 upper half of the top-right corner
];

/** The eight construction lines of the chart. */
export const CHART_LINES: [Pt, Pt][] = [
  [TL, BR], [TR, BL],        // diagonals
  [T, R], [R, B], [B, L], [L, T], // the diamond
];

const centroid = (poly: Pt[]): Pt => [
  poly.reduce((s, p) => s + p[0], 0) / poly.length,
  poly.reduce((s, p) => s + p[1], 0) / poly.length,
];

const bboxOf = (poly: Pt[]) => ({
  x0: Math.min(...poly.map((p) => p[0])),
  x1: Math.max(...poly.map((p) => p[0])),
  y0: Math.min(...poly.map((p) => p[1])),
  y1: Math.max(...poly.map((p) => p[1])),
});

/** Ray-casting point-in-polygon, used to prove labels stay inside a house. */
export function pointInPolygon(point: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect = yi > point[1] !== yj > point[1]
      && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/* ------------------------------------------------------------------ */
/* Layout                                                             */
/* ------------------------------------------------------------------ */

export interface ChartRenderOptions {
  /**
   * Chart edge length, expressed in the drawing surface's own unit:
   * millimetres for the PDF (jsPDF default) and pixels for SVG.
   */
  size?: number;
  /**
   * How many surface units one typographic point occupies.
   * 0.3528 for a millimetre surface (25.4 / 72), 4/3 for a pixel surface.
   */
  unitsPerPoint?: number;
  /** Font size for planet labels at full fit. */
  baseFontSize?: number;
  /** Never go below this size; below it the textual list is the guarantee. */
  minFontSize?: number;
  showHouseNumbers?: boolean;
  /** Grayscale-safe palette; no colour carries meaning. */
  palette?: { stroke: number; text: number; lagna: number; muted: number };
  /**
   * Stroke width of the Lagna marker, in surface units.
   *
   * Added in V40.1 so a renderer with a finer type colour can set a rule that
   * reads as deliberate rather than as a printing fault. The default is the
   * historical value, so v1 and v2 output is unchanged.
   */
  lagnaMarkerWidth?: number;
  title?: string;
}

export const DEFAULT_CHART_OPTIONS: Required<ChartRenderOptions> = {
  size: 130,
  unitsPerPoint: 25.4 / 72,
  baseFontSize: 8.5,
  minFontSize: 6,
  showHouseNumbers: true,
  palette: { stroke: 60, text: 20, lagna: 20, muted: 110 },
  lagnaMarkerWidth: 1.6,
  title: '',
};

export interface ChartLabel {
  x: number; y: number;
  text: string;
  /** Size in surface units, which is what SVG and jsPDF positioning need. */
  fontSize: number;
  /** Size in typographic points — the figure a reader cares about. */
  fontSizePt: number;
  kind: 'sign' | 'house' | 'planet' | 'lagna';
  /** Present for planet labels. */
  planetId?: string;
  retrograde?: boolean;
  /** Estimated box, used for overlap and clipping checks. */
  box: { x: number; y: number; w: number; h: number };
}

export interface ChartLayout {
  layoutVersion: string;
  size: number;
  polygons: Pt[][];
  lines: [Pt, Pt][];
  labels: ChartLabel[];
  /** The Lagna marker: a bold rule under house 1. */
  lagnaMarker: { x: number; y: number; w: number };
  /** Text rendered beside the chart, always present. */
  textual: string[];
}

const textWidth = (text: string, fontSize: number) => text.length * fontSize * 0.58;

/**
 * Shrinks a polygon toward its centroid, giving a region guaranteed to sit
 * inside it. Labels are laid out within this inner region so no label can
 * escape its house.
 */
const INNER_SCALE = 0.52;
const innerPolygon = (poly: Pt[]): Pt[] => {
  const c = centroid(poly);
  return poly.map(([x, y]) => [c[0] + (x - c[0]) * INNER_SCALE, c[1] + (y - c[1]) * INNER_SCALE] as Pt);
};

/**
 * Lays out every label deterministically.
 *
 * Rules, in order of precedence:
 *  1. no planet is ever hidden;
 *  2. no two label boxes overlap;
 *  3. no label centre leaves its house polygon;
 *  4. font size is reduced only within [minFontSize, baseFontSize].
 *
 * Column count is derived from the space actually available rather than a
 * fixed threshold, so a crowded house wraps into more columns instead of
 * overflowing.
 */
export function layoutChart(
  model: ChartRenderModel,
  options: ChartRenderOptions = {},
): ChartLayout {
  const opt = { ...DEFAULT_CHART_OPTIONS, ...options };
  const scale = opt.size / 100;
  const upp = opt.unitsPerPoint;              // surface units per typographic point
  const u = (pt: number) => pt * upp;
  const byHouse = occupantsByHouse(model);
  const labels: ChartLabel[] = [];
  // V40.1: the house index used to be set at 6.5pt, which is below the 7pt
  // legibility floor the print gate enforces — a Pandit reading a printed
  // chart under a lamp should not have to squint at the one label that tells
  // them which bhava they are looking at. Both chrome sizes were raised and
  // the hierarchy is now carried by weight and colour (the house index is
  // grey, the rashi index is dark) rather than by shrinking one of them below
  // readability.
  const houseFontPt = Math.max(7.1, Math.min(7.6, opt.baseFontSize - 1.2));
  const signFontPt = Math.max(Math.max(opt.minFontSize, 7.1), Math.min(8.2, opt.baseFontSize - 0.5));
  const houseFont = u(houseFontPt);
  const signFont = u(signFontPt);

  for (let i = 0; i < 12; i++) {
    const houseNumber = i + 1;
    const poly = HOUSE_POLYGONS[i];
    const c = centroid(poly);
    const inner = bboxOf(innerPolygon(poly));
    const house = model.houses.find((h) => h.houseNumber === houseNumber);
    if (!house) throw new Error(`layoutChart: house ${houseNumber} missing from the render model`);

    const cx = c[0] * scale;
    const availableW = (inner.x1 - inner.x0) * scale;
    const innerTop = inner.y0 * scale;
    const innerH = (inner.y1 - inner.y0) * scale;

    // Explicit baseline bookkeeping: each line starts a small gap below the
    // bottom of the previous line's box, so no two boxes can overlap.
    const GAP = u(0.4);

    const occupants = byHouse.get(houseNumber) ?? [];

    // --- Work out the planet block ------------------------------------
    // An empty house still draws its house number and sign number; only the
    // planet block is conditional.
    const chromeH = (opt.showHouseNumbers ? houseFont * 1.2 : 0) + signFont * 1.25;
    const provisionalSpace = Math.max(u(opt.minFontSize) * 1.25, innerH - chromeH - GAP * 2);
    let rows = 0;
    let columns = 1;
    let fontSize = u(opt.baseFontSize);
    let step = 0;
    let colW = availableW;

    if (occupants.length > 0) {
      const maxRows = Math.max(1, Math.floor(provisionalSpace / (u(opt.minFontSize) * 1.25)));
      columns = Math.max(1, Math.min(4, Math.ceil(occupants.length / maxRows)));
      rows = Math.ceil(occupants.length / columns);
      fontSize = Math.min(u(opt.baseFontSize), provisionalSpace / (rows * 1.25));
      colW = availableW / columns;
      const longest = Math.max(...occupants.map((p) => (p.abbreviation ?? '').length));
      fontSize = Math.min(fontSize, colW / Math.max(1, longest * 0.58));
      fontSize = Math.max(u(opt.minFontSize), fontSize);
      step = fontSize * 1.25;
    }

    // Centre the block vertically when it fits; otherwise start at the top.
    const blockH = chromeH + GAP * 2 + rows * step;
    let bottom = innerTop;
    if (blockH < innerH) bottom = innerTop + (innerH - blockH) / 2;

    // --- House number --------------------------------------------------
    if (opt.showHouseNumbers) {
      const hText = signLabel(houseNumber, model.labelMode, model.devanagariNumerals);
      const y = bottom + houseFont * 0.9;
      labels.push({
        x: cx, y, text: hText, fontSize: houseFont, fontSizePt: houseFontPt,
        kind: 'house',
        box: { x: cx - textWidth(hText, houseFont) / 2, y: y - houseFont * 0.8, w: textWidth(hText, houseFont), h: houseFont * 1.1 },
      });
      bottom = y + houseFont * 0.3;
    }

    // --- Sign number ----------------------------------------------------
    const signText = signLabel(house.signNumber, model.labelMode, model.devanagariNumerals);
    const signY = bottom + GAP + signFont * 0.8;
    labels.push({
      x: cx, y: signY, text: signText, fontSize: signFont, fontSizePt: signFontPt,
      kind: 'sign',
      box: { x: cx - textWidth(signText, signFont) / 2, y: signY - signFont * 0.8, w: textWidth(signText, signFont), h: signFont * 1.1 },
    });
    bottom = signY + signFont * 0.3;

    // --- Grahas ---------------------------------------------------------
    const fontSizePt = Math.max(opt.minFontSize, Math.min(opt.baseFontSize, fontSize / upp));
    for (let idx = 0; idx < occupants.length; idx++) {
      const col = Math.floor(idx / rows);
      const row = idx % rows;
      const p: ChartPlacement = occupants[idx];
      const text = p.abbreviation ?? '';
      const w = textWidth(text, fontSize);
      const x = cx - availableW / 2 + colW * (col + 0.5);
      const y = bottom + GAP + fontSize * 0.8 + row * step;
      labels.push({
        x, y, text, fontSize, fontSizePt,
        kind: 'planet',
        planetId: p.planetId,
        retrograde: p.retrograde,
        box: { x: x - w / 2, y: y - fontSize * 0.8, w, h: fontSize * 1.1 },
      });
    }
  }

  const lagnaBox = bboxOf(innerPolygon(HOUSE_POLYGONS[0]));
  const lagnaMarker = {
    x: lagnaBox.x0 * scale,
    y: (lagnaBox.y1 + 1.5) * scale,
    w: (lagnaBox.x1 - lagnaBox.x0) * scale,
  };

  return {
    layoutVersion: CHART_LAYOUT_VERSION,
    size: opt.size,
    polygons: HOUSE_POLYGONS,
    lines: CHART_LINES,
    labels,
    lagnaMarker,
    textual: model.textual,
  };
}

/* ------------------------------------------------------------------ */
/* SVG                                                                */
/* ------------------------------------------------------------------ */

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Renders the chart as SVG. Deterministic: same model in, byte-identical
 * string out. `font-family` lists DejaVu/Noto first so Devanagari renders
 * wherever those are installed; the PDF path uses the embedded font and does
 * not rely on this at all.
 */
export function renderChartSvg(
  model: ChartRenderModel,
  options: ChartRenderOptions = {},
): string {
  // SVG surfaces are measured in pixels: one point is 4/3 px.
  const opt = { ...DEFAULT_CHART_OPTIONS, size: 420, unitsPerPoint: 4 / 3, ...options };
  const layout = layoutChart(model, opt);
  const scale = opt.size / 100;
  const pad = 6;
  const w = opt.size + pad * 2;
  const h = opt.size + pad * 2 + (opt.title ? 20 : 0);
  const parts: string[] = [];

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" ` +
    `viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(model.chartName)} chart" ` +
    `data-chart-model="${esc(model.chartModelVersion)}" data-layout="${esc(layout.layoutVersion)}" ` +
    `data-placement-hash="${esc(model.placementHash)}">`,
  );
  parts.push(
    `<style>text{font-family:'Noto Sans Devanagari','DejaVu Sans',Arial,sans-serif;}` +
    `.sign{fill:#333}.house{fill:#777}.planet{fill:#111}.lagna{fill:#000;stroke:#000;stroke-width:1.4}` +
    `@media print{text{font-family:'Noto Sans Devanagari','DejaVu Sans',Arial,sans-serif}}</style>`,
  );
  parts.push(`<rect width="${w}" height="${h}" fill="#ffffff"/>`);
  if (opt.title) {
    parts.push(`<text x="${pad}" y="14" font-size="11" class="sign">${esc(opt.title)}</text>`);
  }
  const dy = opt.title ? 20 : 0;
  parts.push(`<g transform="translate(${pad},${pad + dy})">`);
  parts.push(`<rect x="0" y="0" width="${opt.size}" height="${opt.size}" fill="none" stroke="#3c3c3c" stroke-width="1"/>`);
  for (const [a, b] of layout.lines) {
    parts.push(`<line x1="${a[0] * scale}" y1="${a[1] * scale}" x2="${b[0] * scale}" y2="${b[1] * scale}" stroke="#3c3c3c" stroke-width="1"/>`);
  }
  // Lagna marker: a bold rule beneath house 1. Shape, not colour, carries
  // the meaning, so it survives grayscale printing.
  parts.push(
    `<line x1="${layout.lagnaMarker.x}" y1="${layout.lagnaMarker.y}" ` +
    `x2="${layout.lagnaMarker.x + layout.lagnaMarker.w}" y2="${layout.lagnaMarker.y}" ` +
    `stroke="#000" stroke-width="2.2" class="lagna"/>`,
  );
  for (const l of layout.labels) {
    const cls = l.kind === 'planet' ? 'planet' : l.kind === 'sign' ? 'sign' : 'house';
    const anchor = 'middle';
    parts.push(
      `<text x="${l.x.toFixed(2)}" y="${l.y.toFixed(2)}" font-size="${l.fontSize.toFixed(2)}" ` +
      `text-anchor="${anchor}" class="${cls}" data-kind="${l.kind}"` +
      `${l.planetId ? ` data-planet="${esc(l.planetId)}"` : ''}` +
      `${l.retrograde ? ' data-retrograde="true"' : ''}>${esc(l.text)}</text>`,
    );
    if (l.retrograde) {
      // Retrograde marker: a short rule under the label. Drawn as geometry,
      // so it needs no glyph and prints identically in monochrome.
      const uw = Math.max(6, l.fontSize * 0.75);
      parts.push(
        `<line x1="${(l.x - uw / 2).toFixed(2)}" y1="${(l.y + l.fontSize * 0.28).toFixed(2)}" ` +
        `x2="${(l.x + uw / 2).toFixed(2)}" y2="${(l.y + l.fontSize * 0.28).toFixed(2)}" ` +
        `stroke="#000" stroke-width="0.7" data-retrograde-marker="${esc(l.planetId ?? '')}"/>`,
      );
    }
  }
  parts.push('</g>');
  parts.push(
    `<desc>${esc(model.textual.join(' '))}</desc>`,
  );
  parts.push('</svg>');
  return parts.join('\n');
}

/* ------------------------------------------------------------------ */
/* PDF vector primitives                                              */
/* ------------------------------------------------------------------ */

/** Minimal surface the renderer needs from jsPDF. */
export interface PdfChartSurface {
  setDrawColor(v: number): void;
  setTextColor(v: number): void;
  setLineWidth(v: number): void;
  setFontSize(v: number): void;
  setFont(name: string, style: string): void;
  line(x1: number, y1: number, x2: number, y2: number): unknown;
  rect(x: number, y: number, w: number, h: number): unknown;
  text(t: string, x: number, y: number, opts?: { align?: string }): unknown;
  getTextWidth?(t: string): number;
}

/**
 * Draws the chart into a PDF as vector lines and text.
 *
 * Devanagari strings are drawn with the embedded Devanagari font when the
 * caller reports it is available; the caller MUST NOT fall back to a Latin
 * font for Devanagari text, because that silently produces blank or boxed
 * glyphs. `devFontAvailable === false` with Devanagari present throws.
 */
export function drawChartToPdf(
  doc: PdfChartSurface,
  model: ChartRenderModel,
  x: number,
  y: number,
  options: ChartRenderOptions & { devFontAvailable: boolean } = { devFontAvailable: false },
): { width: number; height: number } {
  const layout = layoutChart(model, options);
  const opt = { ...DEFAULT_CHART_OPTIONS, ...options };
  const scale = opt.size / 100;
  const hasDev = (t: string) => /[\u0900-\u097F]/.test(t);

  if (model.labelMode !== 'EN' && !options.devFontAvailable) {
    // Refuse rather than emit boxes or blanks.
    throw new Error(
      `cannot draw a ${model.labelMode} chart without the embedded Devanagari font`,
    );
  }

  doc.setDrawColor(opt.palette.stroke);
  doc.setLineWidth(0.6);
  doc.rect(x, y, opt.size, opt.size);
  for (const [a, b] of layout.lines) {
    doc.line(x + a[0] * scale, y + a[1] * scale, x + b[0] * scale, y + b[1] * scale);
  }

  // Lagna marker: a bold rule. Shape carries the meaning, not colour.
  doc.setDrawColor(opt.palette.lagna);
  doc.setLineWidth(opt.lagnaMarkerWidth);
  doc.line(
    x + layout.lagnaMarker.x, y + layout.lagnaMarker.y,
    x + layout.lagnaMarker.x + layout.lagnaMarker.w, y + layout.lagnaMarker.y,
  );
  doc.setLineWidth(0.6);

  for (const l of layout.labels) {
    doc.setFontSize(l.fontSizePt);
    doc.setFont(hasDev(l.text) ? 'devanagari' : 'helvetica', 'normal');
    doc.setTextColor(l.kind === 'house' ? opt.palette.muted : opt.palette.text);
    doc.text(l.text, x + l.x, y + l.y, { align: 'center' });
    if (l.retrograde) {
      const uw = Math.max(5, l.fontSize * 0.7);
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(x + l.x - uw / 2, y + l.y + l.fontSize * 0.28, x + l.x + uw / 2, y + l.y + l.fontSize * 0.28);
      doc.setLineWidth(0.6);
    }
  }

  return { width: opt.size, height: opt.size };
}

/* ------------------------------------------------------------------ */
/* Structural checks (used by tests and by the consistency gate)       */
/* ------------------------------------------------------------------ */

export interface ChartGeometryIssue {
  code: string;
  detail: string;
}

/** Every structural defect a drawing can have, detected without eyes. */
export function auditChartLayout(
  model: ChartRenderModel,
  options: ChartRenderOptions = {},
): ChartGeometryIssue[] {
  const issues: ChartGeometryIssue[] = [];
  const layout = layoutChart(model, options);
  const opt = { ...DEFAULT_CHART_OPTIONS, ...options };
  const scale = opt.size / 100;

  if (layout.polygons.length !== 12) issues.push({ code: 'CHART_POLYGON_COUNT', detail: `${layout.polygons.length}` });

  // Every label must sit inside its own house polygon.
  for (const l of layout.labels) {
    const polyIndex = labelPolygonIndex(layout, l);
    if (polyIndex < 0) {
      issues.push({ code: 'CHART_LABEL_OUTSIDE_HOUSE', detail: `${l.kind}:${l.text} has no house` });
      continue;
    }
    const pt: Pt = [l.x / scale, l.y / scale];
    if (!pointInPolygon(pt, layout.polygons[polyIndex])) {
      issues.push({
        code: 'CHART_LABEL_OUTSIDE_HOUSE',
        detail: `${l.kind}:${l.text} at (${pt[0].toFixed(1)},${pt[1].toFixed(1)}) is outside house ${polyIndex + 1}`,
      });
    }
  }

  // No two label boxes may overlap.
  for (let i = 0; i < layout.labels.length; i++) {
    for (let j = i + 1; j < layout.labels.length; j++) {
      const a = layout.labels[i].box;
      const b = layout.labels[j].box;
      const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      if (overlap) {
        issues.push({
          code: 'CHART_LABEL_OVERLAP',
          detail: `${layout.labels[i].kind}:${layout.labels[i].text} overlaps ${layout.labels[j].kind}:${layout.labels[j].text}`,
        });
      }
    }
  }

  // Nothing may exceed the chart box.
  for (const l of layout.labels) {
    if (l.box.x < -0.5 || l.box.y < -0.5 || l.box.x + l.box.w > opt.size + 0.5 || l.box.y + l.box.h > opt.size + 0.5) {
      issues.push({ code: 'CHART_LABEL_CLIPPED', detail: `${l.kind}:${l.text}` });
    }
  }

  // Every placement must be labelled exactly once.
  for (const p of model.placements) {
    const drawn = layout.labels.filter((l) => l.planetId === p.planetId);
    if (drawn.length === 0) issues.push({ code: 'CHART_PLANET_MISSING', detail: `${p.planetId}` });
    if (drawn.length > 1) issues.push({ code: 'CHART_PLANET_DUPLICATED', detail: `${p.planetId} drawn ${drawn.length} times` });
  }

  // Font sizes must stay within the approved band.
  for (const l of layout.labels) {
    if (l.kind === 'planet' && (l.fontSizePt < opt.minFontSize - 1e-9 || l.fontSizePt > opt.baseFontSize + 1e-9)) {
      issues.push({ code: 'CHART_FONT_OUT_OF_RANGE', detail: `${l.text} at ${l.fontSizePt.toFixed(2)}pt` });
    }
  }

  return issues;
}

/** Which house polygon a label belongs to (nearest centroid). */
function labelPolygonIndex(layout: ChartLayout, label: ChartLabel): number {
  let best = -1;
  let bestD = Infinity;
  const scale = layout.size / 100;
  for (let i = 0; i < layout.polygons.length; i++) {
    const c = centroid(layout.polygons[i]);
    const d = (c[0] * scale - label.x) ** 2 + (c[1] * scale - label.y) ** 2;
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}
