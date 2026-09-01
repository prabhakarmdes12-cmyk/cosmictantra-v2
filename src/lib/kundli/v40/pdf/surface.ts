/**
 * KUNDLI V40.1 — PDF drawing surface (renderer v3).
 *
 * A thin, millimetre-based drawing API over pdfkit. Everything above this file
 * thinks in millimetres and design tokens; everything below it is PostScript
 * points and content streams. The renderer never touches pdfkit directly.
 *
 * Three properties this surface is responsible for:
 *
 *   1. SHAPING. Text is drawn run by run, each run in exactly one font, so
 *      fontkit's OpenType layout engine sees a complete script run and applies
 *      the Devanagari GSUB/GPOS tables. The renderer above never reorders a
 *      single codepoint.
 *   2. DETERMINISM. Width measurement uses the same shaped advance the drawing
 *      uses, so a line that measures as fitting actually fits. jsPDF's
 *      `getTextWidth` did not have that property for Devanagari.
 *   3. HONEST FAILURE. A codepoint no embedded face can draw raises; it never
 *      becomes a .notdef box.
 */

import PDFDocument from 'pdfkit';
import { FontStack, isDevanagariRole, type FontRole, type RunStyle, type TextRun } from './fontStack';

/** 1 mm in PostScript points. */
export const MM = 72 / 25.4;
export const mmToPt = (mm: number): number => mm * MM;
export const ptToMm = (pt: number): number => pt / MM;

export type Rgb = readonly [number, number, number];

export interface SurfaceOptions {
  widthMm: number;
  heightMm: number;
  fonts: FontStack;
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  /** Fixed creation date keeps byte output reproducible for a given model. */
  creationDate?: Date;
}

export interface DrawTextOptions {
  /** Point size. */
  size: number;
  style: RunStyle;
  color?: Rgb;
  /** Character spacing in mm; used only for the cover's letter-spaced brand. */
  trackingMm?: number;
}

/**
 * A single laid-out visual line: a sequence of same-font runs with their
 * measured widths, ready to be drawn without any further decisions.
 */
export interface LaidRun extends TextRun {
  widthMm: number;
}

export interface LaidLine {
  runs: LaidRun[];
  widthMm: number;
  /** Total characters, for blank-page bookkeeping. */
  charCount: number;
}

export class PdfSurfaceV3 {
  private readonly doc: PDFKit.PDFDocument;
  private readonly chunks: Buffer[] = [];
  private readonly done: Promise<Uint8Array>;
  private readonly registered = new Set<FontRole>();
  readonly fonts: FontStack;
  readonly widthMm: number;
  readonly heightMm: number;
  private pages = 1;

  constructor(opts: SurfaceOptions) {
    this.fonts = opts.fonts;
    this.widthMm = opts.widthMm;
    this.heightMm = opts.heightMm;

    this.doc = new PDFDocument({
      size: [mmToPt(opts.widthMm), mmToPt(opts.heightMm)],
      margins: { top: 0, left: 0, bottom: 0, right: 0 },
      bufferPages: true,
      autoFirstPage: true,
      compress: true,
      info: {
        Title: opts.title ?? 'Kundli',
        Author: opts.author ?? 'CosmicTantra',
        Subject: opts.subject ?? 'Vedic astrological reference document',
        Keywords: opts.keywords ?? 'kundli, jyotish, vedic astrology',
        Producer: 'CosmicTantra kundli-pdf-renderer-v3',
        Creator: 'CosmicTantra kundli-pdf-renderer-v3',
        ...(opts.creationDate ? { CreationDate: opts.creationDate, ModDate: opts.creationDate } : {}),
      },
    });

    this.doc.on('data', (c: Buffer) => this.chunks.push(c));
    this.done = new Promise<Uint8Array>((resolve, reject) => {
      this.doc.on('end', () => resolve(new Uint8Array(Buffer.concat(this.chunks))));
      this.doc.on('error', reject);
    });
  }

  /* ---------------- fonts ---------------- */

  private useFont(role: FontRole, sizePt: number): void {
    if (!this.registered.has(role)) {
      this.doc.registerFont(role, Buffer.from(this.fonts.binaries[role]));
      this.registered.add(role);
    }
    this.doc.font(role).fontSize(sizePt);
  }

  /**
   * Letter-spacing in points for a run, in the units pdfkit wants.
   *
   * Devanagari runs are never tracked, for two independent reasons.
   *
   * Typographic: tracking is a Latin device (it opens up small-caps running
   * heads and short labels). Devanagari builds a syllable as a base plus
   * attached matras under one shirorekha; prising the glyphs apart is simply
   * wrong, and no Devanagari typesetting tradition does it.
   *
   * Mechanical: pdfkit's `Tc` handling breaks on complex scripts. Its
   * `widthOfString` bills tracking as `Tc x (utf16Length - 1)`, but the PDF
   * `Tc` operator is applied once per *glyph* — and shaping turns 17 code
   * units of "कार्यात्मक भूमिका" into 15 glyphs, so the measured width runs
   * ahead of the drawn width and a gap opens before the next run. Worse, when
   * a glyph carries a GPOS offset pdfkit re-anchors the pen with an absolute
   * `Tm` that omits the accumulated `Tc`, which swallows the space that
   * follows a mark-bearing cluster ("एवं दृष्टि" drew as "एवंदृष्टि").
   * Suppressing tracking removes the cause rather than compensating for it.
   */
  private trackingPtFor(role: FontRole, trackingMm: number): number {
    if (trackingMm === 0 || isDevanagariRole(role)) return 0;
    return mmToPt(trackingMm);
  }

  /** Shaped advance width of a run, in millimetres. */
  measureRunMm(text: string, role: FontRole, sizePt: number, trackingMm = 0): number {
    this.useFont(role, sizePt);
    return ptToMm(this.doc.widthOfString(text, {
      characterSpacing: this.trackingPtFor(role, trackingMm),
    }));
  }

  /** Shaped advance width of a whole string across all its font runs. */
  measureMm(text: string, style: RunStyle, sizePt: number, trackingMm = 0): number {
    let w = 0;
    for (const run of this.fonts.runsFor(text, style)) {
      w += this.measureRunMm(run.text, run.role, sizePt, trackingMm);
    }
    return w;
  }

  /**
   * Ascent above the baseline, in mm, for the dominant face of a style.
   * Used for box geometry, never for baseline placement (the caller owns that).
   */
  ascentMm(role: FontRole, sizePt: number): number {
    const face = this.fonts.face(role);
    return ptToMm((face.ascent / face.unitsPerEm) * sizePt);
  }

  descentMm(role: FontRole, sizePt: number): number {
    const face = this.fonts.face(role);
    return ptToMm((Math.abs(face.descent) / face.unitsPerEm) * sizePt);
  }

  /* ---------------- text ---------------- */

  /**
   * Draws one already-measured line at an ALPHABETIC baseline.
   *
   * Baseline placement is the caller's job because a document with mixed
   * Latin and Devanagari on one line must sit on one shared baseline; letting
   * pdfkit place each run by its own line box would produce a visible stagger.
   */
  drawLine(line: LaidLine, xMm: number, baselineMm: number, opts: DrawTextOptions): void {
    let x = xMm;
    const color = opts.color ?? ([0, 0, 0] as Rgb);
    for (const run of line.runs) {
      this.useFont(run.role, opts.size);
      this.doc.fillColor([color[0], color[1], color[2]]);
      const tc = this.trackingPtFor(run.role, opts.trackingMm ?? 0);
      this.doc.text(run.text, mmToPt(x), mmToPt(baselineMm), {
        lineBreak: false,
        baseline: 'alphabetic',
        characterSpacing: tc,
      });
      // Tc is text state and survives the enclosing BT/ET, so it is reset
      // explicitly. Leaving it set would letter-space the next unrelated run.
      if (tc) this.doc.addContent('0 Tc');
      x += run.widthMm;
    }
  }

  /** Convenience: measure a bare string into a single line. */
  layoutSingle(text: string, style: RunStyle, sizePt: number, trackingMm = 0): LaidLine {
    const runs: LaidRun[] = this.fonts.runsFor(text, style).map((r) => ({
      ...r,
      widthMm: this.measureRunMm(r.text, r.role, sizePt, trackingMm),
    }));
    return {
      runs,
      widthMm: runs.reduce((n, r) => n + r.widthMm, 0),
      charCount: text.length,
    };
  }

  /* ---------------- vector primitives ---------------- */

  fillRect(xMm: number, yMm: number, wMm: number, hMm: number, color: Rgb): void {
    this.doc.save();
    this.doc.rect(mmToPt(xMm), mmToPt(yMm), mmToPt(wMm), mmToPt(hMm))
      .fill([color[0], color[1], color[2]]);
    this.doc.restore();
  }

  strokeRect(xMm: number, yMm: number, wMm: number, hMm: number, color: Rgb, widthMm: number): void {
    this.doc.save();
    this.doc.lineWidth(mmToPt(widthMm))
      .rect(mmToPt(xMm), mmToPt(yMm), mmToPt(wMm), mmToPt(hMm))
      .stroke([color[0], color[1], color[2]]);
    this.doc.restore();
  }

  line(x1: number, y1: number, x2: number, y2: number, color: Rgb, widthMm: number): void {
    this.doc.save();
    this.doc.lineWidth(mmToPt(widthMm))
      .moveTo(mmToPt(x1), mmToPt(y1))
      .lineTo(mmToPt(x2), mmToPt(y2))
      .stroke([color[0], color[1], color[2]]);
    this.doc.restore();
  }

  circle(cxMm: number, cyMm: number, rMm: number, color: Rgb, mode: 'fill' | 'stroke', widthMm = 0.2): void {
    this.doc.save();
    this.doc.circle(mmToPt(cxMm), mmToPt(cyMm), mmToPt(rMm));
    if (mode === 'fill') this.doc.fill([color[0], color[1], color[2]]);
    else this.doc.lineWidth(mmToPt(widthMm)).stroke([color[0], color[1], color[2]]);
    this.doc.restore();
  }

  polygon(points: [number, number][], color: Rgb, mode: 'fill' | 'stroke', widthMm = 0.2): void {
    if (points.length < 2) return;
    this.doc.save();
    this.doc.moveTo(mmToPt(points[0][0]), mmToPt(points[0][1]));
    for (const [x, y] of points.slice(1)) this.doc.lineTo(mmToPt(x), mmToPt(y));
    this.doc.closePath();
    if (mode === 'fill') this.doc.fill([color[0], color[1], color[2]]);
    else this.doc.lineWidth(mmToPt(widthMm)).stroke([color[0], color[1], color[2]]);
    this.doc.restore();
  }

  /** Optional raster (the cover marks). Failure is never fatal. */
  image(dataUrlOrBuffer: string | Buffer, xMm: number, yMm: number, wMm: number, hMm: number): boolean {
    try {
      const src = typeof dataUrlOrBuffer === 'string'
        ? Buffer.from(dataUrlOrBuffer.replace(/^data:[^,]+,/, ''), 'base64')
        : dataUrlOrBuffer;
      this.doc.image(src, mmToPt(xMm), mmToPt(yMm), { width: mmToPt(wMm), height: mmToPt(hMm) });
      return true;
    } catch {
      return false;
    }
  }

  /* ---------------- pages ---------------- */

  addPage(): void {
    this.doc.addPage({
      size: [mmToPt(this.widthMm), mmToPt(this.heightMm)],
      margins: { top: 0, left: 0, bottom: 0, right: 0 },
    });
    this.pages += 1;
  }

  get pageCount(): number {
    return this.pages;
  }

  /** 1-based, matching the pagination controller's numbering. */
  switchToPage(page: number): void {
    this.doc.switchToPage(page - 1);
  }

  async finish(): Promise<Uint8Array> {
    this.doc.flushPages();
    this.doc.end();
    return this.done;
  }
}
