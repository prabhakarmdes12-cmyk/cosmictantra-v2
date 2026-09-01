/**
 * KUNDLI V40.1 — PDF inspection toolkit (§6, §8).
 *
 * Two independent classes of QA, as the brief requires, because they catch
 * different failures and neither subsumes the other:
 *
 *   SEMANTIC QA  reads the text layer. Answers: is the value right, did the
 *                Unicode survive, is the evidence reference present.
 *                CANNOT see a glyph drawn in the wrong place.
 *
 *   VISUAL QA    reads pixels and geometry. Answers: did anything clip, did a
 *                table overflow, did a heading strand itself, did the shaper
 *                actually run, did a font substitute.
 *                CANNOT tell you whether the number is correct.
 *
 * Everything here runs on MuPDF's WebAssembly build, so the suite needs no
 * browser, no native module and no external binary.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type * as MupdfNs from 'mupdf';

/**
 * MuPDF's Node build is an ESM module with a top-level await, so it can only
 * be reached through a dynamic import. It is loaded once and cached; every
 * entry point below is async for that reason alone.
 */
type Mupdf = typeof MupdfNs;
let cached: Mupdf | null = null;
export async function loadMupdf(): Promise<Mupdf> {
  if (!cached) cached = (await import('mupdf')) as unknown as Mupdf;
  return cached;
}

export interface TextLine {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fontName: string;
  fontSize: number;
}

export interface PageInspection {
  index: number;
  /** 1-based, matching the footer. */
  number: number;
  widthPt: number;
  heightPt: number;
  text: string;
  lines: TextLine[];
  fonts: string[];
}

export interface PdfInspection {
  pageCount: number;
  pages: PageInspection[];
  allText: string;
  fonts: string[];
}

/** mm expressed in the PostScript points MuPDF reports. */
export const mm = (v: number): number => (v * 72) / 25.4;

interface StJsonLine {
  bbox: { x: number; y: number; w: number; h: number };
  font: { name: string; size?: number };
  text: string;
}
interface StJsonBlock { type: string; lines?: StJsonLine[] }

export async function inspectPdf(buffer: Uint8Array | Buffer): Promise<PdfInspection> {
  const mupdf = await loadMupdf();
  const doc = mupdf.Document.openDocument(Buffer.from(buffer), 'application/pdf');
  const pageCount = doc.countPages();
  const pages: PageInspection[] = [];
  const allFonts = new Set<string>();

  for (let i = 0; i < pageCount; i += 1) {
    const page = doc.loadPage(i);
    const box = page.getBounds();
    const st = JSON.parse(page.toStructuredText('preserve-whitespace').asJSON()) as { blocks: StJsonBlock[] };
    const lines: TextLine[] = [];
    const fonts = new Set<string>();
    for (const block of st.blocks) {
      if (block.type !== 'text' || !block.lines) continue;
      for (const line of block.lines) {
        // MuPDF prefixes an embedded subset with a six-letter tag (ABCDEF+).
        const fontName = (line.font?.name ?? '').replace(/^[A-Z]{6}\+/, '');
        fonts.add(fontName);
        allFonts.add(fontName);
        lines.push({
          text: line.text,
          x: line.bbox.x, y: line.bbox.y, w: line.bbox.w, h: line.bbox.h,
          fontName,
          fontSize: line.font?.size ?? 0,
        });
      }
    }
    pages.push({
      index: i,
      number: i + 1,
      widthPt: box[2] - box[0],
      heightPt: box[3] - box[1],
      text: lines.map((l) => l.text).join('\n'),
      lines,
      fonts: [...fonts].sort(),
    });
  }

  return {
    pageCount,
    pages,
    allText: pages.map((p) => p.text).join('\n'),
    fonts: [...allFonts].sort(),
  };
}

/* ------------------------------------------------------------------ */
/* Raster                                                              */
/* ------------------------------------------------------------------ */

export interface Raster {
  width: number;
  height: number;
  /** RGB, 3 bytes per pixel. */
  pixels: Uint8ClampedArray;
  png: Buffer;
}

/**
 * Copies a pixmap's samples out of the WASM heap.
 *
 * `getPixels()` hands back a typed-array VIEW onto mupdf's linear memory. The
 * next allocation large enough to grow that memory detaches the view, and a
 * detached view reports length 0 — which every downstream check reads as "the
 * page is blank" rather than as an error. Copying at the boundary is the only
 * safe contract; the cost is one memcpy per page.
 */
function ownPixels(view: Uint8ClampedArray): Uint8ClampedArray {
  const copy = new Uint8ClampedArray(view.length);
  copy.set(view);
  return copy;
}

export async function renderPage(buffer: Uint8Array | Buffer, pageIndex: number, dpi = 100): Promise<Raster> {
  const mupdf = await loadMupdf();
  const doc = mupdf.Document.openDocument(Buffer.from(buffer), 'application/pdf');
  const page = doc.loadPage(pageIndex);
  const scale = dpi / 72;
  const pix = page.toPixmap(mupdf.Matrix.scale(scale, scale), mupdf.ColorSpace.DeviceRGB, false, true);
  // PNG first: encoding allocates, and allocation is what detaches the view.
  const png = Buffer.from(pix.asPNG());
  return {
    width: pix.getWidth(),
    height: pix.getHeight(),
    pixels: ownPixels(pix.getPixels()),
    png,
  };
}

export async function decodePng(file: string): Promise<Raster> {
  const mupdf = await loadMupdf();
  const buf = fs.readFileSync(file);
  const img = new mupdf.Image(buf);
  const pix = img.toPixmap();
  return {
    width: pix.getWidth(),
    height: pix.getHeight(),
    pixels: ownPixels(pix.getPixels()),
    png: buf,
  };
}

export interface ImageDiff {
  sameSize: boolean;
  /** Fraction of pixels differing by more than `channelTolerance`. */
  diffFraction: number;
  /** Largest single-channel difference seen. */
  maxChannelDelta: number;
  changedPixels: number;
  totalPixels: number;
}

/**
 * Compares two rasters.
 *
 * Deliberately reported as a NUMBER, not as a pass/fail: the brief forbids
 * making a pixel diff a hard blocker. Font hinting, an antialiasing change or
 * a one-pixel baseline shift all move pixels without moving meaning. The
 * numbers here inform a review; the structural checks below are what fail a
 * build.
 */
export function diffRasters(a: Raster, b: Raster, channelTolerance = 8): ImageDiff {
  if (a.width !== b.width || a.height !== b.height) {
    return {
      sameSize: false, diffFraction: 1, maxChannelDelta: 255,
      changedPixels: -1, totalPixels: a.width * a.height,
    };
  }
  let changed = 0;
  let maxDelta = 0;
  const n = Math.min(a.pixels.length, b.pixels.length);
  for (let i = 0; i < n; i += 3) {
    const d = Math.max(
      Math.abs(a.pixels[i] - b.pixels[i]),
      Math.abs(a.pixels[i + 1] - b.pixels[i + 1]),
      Math.abs(a.pixels[i + 2] - b.pixels[i + 2]),
    );
    if (d > maxDelta) maxDelta = d;
    if (d > channelTolerance) changed += 1;
  }
  const total = a.width * a.height;
  return {
    sameSize: true,
    diffFraction: total > 0 ? changed / total : 0,
    maxChannelDelta: maxDelta,
    changedPixels: changed,
    totalPixels: total,
  };
}

/** Fraction of pixels that are not the page tint — a crude "ink coverage". */
export function inkCoverage(r: Raster, backgroundTolerance = 6): number {
  if (r.pixels.length < 3) {
    throw new Error('KUNDLI_QA_EMPTY_RASTER: no samples — the pixmap view was detached before it was read');
  }
  const bg = [r.pixels[0], r.pixels[1], r.pixels[2]];
  let ink = 0;
  for (let i = 0; i < r.pixels.length; i += 3) {
    const d = Math.max(
      Math.abs(r.pixels[i] - bg[0]),
      Math.abs(r.pixels[i + 1] - bg[1]),
      Math.abs(r.pixels[i + 2] - bg[2]),
    );
    if (d > backgroundTolerance) ink += 1;
  }
  return ink / (r.width * r.height);
}

/* ------------------------------------------------------------------ */
/* Structural checks — these are what fail a build                     */
/* ------------------------------------------------------------------ */

export interface StructuralIssue {
  code: string;
  page: number;
  detail: string;
}

export interface MarginBox {
  leftMm: number;
  rightMm: number;
  topMm: number;
  bottomMm: number;
  pageWidthMm: number;
  pageHeightMm: number;
}

/**
 * Every defect a page can have that a machine can see without a reference
 * image. This is the part of visual QA that is allowed to block a release.
 */
export function structuralAudit(
  inspection: PdfInspection,
  box: MarginBox,
  opts: { minFontSizePt?: number; allowedFonts?: string[]; overlapTolerancePt?: number } = {},
): StructuralIssue[] {
  const issues: StructuralIssue[] = [];
  const minSize = opts.minFontSizePt ?? 7;
  const overlapTol = opts.overlapTolerancePt ?? 1.2;
  const left = mm(box.leftMm);
  const right = mm(box.pageWidthMm - box.rightMm);
  const top = mm(box.topMm);
  const bottom = mm(box.pageHeightMm - box.bottomMm);

  for (const page of inspection.pages) {
    // 1. Nothing may sit outside the printable box.
    for (const line of page.lines) {
      if (line.x < left - 2 || line.x + line.w > right + 2) {
        issues.push({
          code: 'TEXT_OUTSIDE_HORIZONTAL_MARGIN', page: page.number,
          detail: `"${line.text.slice(0, 40)}" spans ${line.x.toFixed(1)}..${(line.x + line.w).toFixed(1)}pt, box is ${left.toFixed(1)}..${right.toFixed(1)}pt`,
        });
      }
      if (line.y < top - 4 || line.y + line.h > bottom + 4) {
        issues.push({
          code: 'TEXT_OUTSIDE_VERTICAL_MARGIN', page: page.number,
          detail: `"${line.text.slice(0, 40)}" spans ${line.y.toFixed(1)}..${(line.y + line.h).toFixed(1)}pt, box is ${top.toFixed(1)}..${bottom.toFixed(1)}pt`,
        });
      }
      // 2. Nothing may be unreadably small.
      //    MuPDF reports the size FLOORED to a whole point, so a reported 6
      //    means the real size is somewhere in [6, 7). Comparing against the
      //    floored threshold keeps the check conservative in the right
      //    direction: it flags anything that could be below the minimum.
      if (line.fontSize > 0 && line.fontSize < Math.floor(minSize) && line.text.trim().length > 0) {
        issues.push({
          code: 'TEXT_BELOW_MINIMUM_SIZE', page: page.number,
          detail: `"${line.text.slice(0, 40)}" reported at ${line.fontSize.toFixed(2)}pt (floored), floor is ${minSize}pt`,
        });
      }
      // 3. Nothing may extract as a replacement character.
      if (/[\uFFFD]/.test(line.text)) {
        issues.push({
          code: 'REPLACEMENT_CHARACTER', page: page.number,
          detail: `"${line.text.slice(0, 60)}"`,
        });
      }
      // 4. Only fonts we embedded may appear.
      // MuPDF truncates a subset font name to 24 characters, so the allow
      // list is matched by prefix rather than by equality.
      const fontAllowed = !opts.allowedFonts || !line.fontName
        || opts.allowedFonts.some((f) => f.startsWith(line.fontName) || line.fontName.startsWith(f));
      if (!fontAllowed) {
        issues.push({
          code: 'UNEXPECTED_FONT', page: page.number,
          detail: `${line.fontName} in "${line.text.slice(0, 40)}"`,
        });
      }
    }

    // 5. No two lines may collide. A collision is the signature of a row
    //    measured with one string and drawn with another.
    //
    //    The vertical tolerance is proportional to type size, because a line's
    //    bbox is its FONT bbox, not its ink bbox: it reaches up to the
    //    ascender and down to the descender even when the glyphs in it do
    //    neither. Two tightly leaded lines of digits therefore report a
    //    couple of points of bbox overlap with clear white space between
    //    them. A fixed 1.2pt tolerance reads that as a collision and buries
    //    the real ones in noise. Scaling by the em keeps genuine collisions
    //    — which overlap by most of a line — comfortably detected.
    for (let i = 0; i < page.lines.length; i += 1) {
      for (let j = i + 1; j < page.lines.length; j += 1) {
        const a = page.lines[i];
        const b = page.lines[j];
        const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        const em = Math.min(a.fontSize || 10, b.fontSize || 10);
        const tolY = Math.max(overlapTol, em * 0.45);
        if (overlapX > overlapTol && overlapY > tolY) {
          issues.push({
            code: 'TEXT_OVERLAP', page: page.number,
            detail: `"${a.text.slice(0, 30)}" overlaps "${b.text.slice(0, 30)}" by ${overlapX.toFixed(1)}x${overlapY.toFixed(1)}pt (vertical tolerance ${tolY.toFixed(1)}pt)`,
          });
        }
      }
    }
  }
  return issues;
}

/**
 * A heading is orphaned when it is the last thing on its page. Checked against
 * the model's own heading strings rather than by guessing from font size.
 */
export function findOrphanHeadings(
  inspection: PdfInspection,
  headings: string[],
  tailToleranceMm = 26,
): StructuralIssue[] {
  const issues: StructuralIssue[] = [];
  const wanted = new Set(headings.map((h) => h.trim()).filter((h) => h.length > 0));
  for (const page of inspection.pages) {
    const body = page.lines.filter((l) => l.y > mm(18) && l.y < page.heightPt - mm(18));
    if (body.length === 0) continue;
    const last = body.reduce((acc, l) => (l.y > acc.y ? l : acc), body[0]);
    if (wanted.has(last.text.trim())) {
      issues.push({
        code: 'ORPHAN_HEADING', page: page.number,
        detail: `"${last.text.trim()}" is the last content on the page`,
      });
    }
    void tailToleranceMm;
  }
  return issues;
}

/* ------------------------------------------------------------------ */
/* Snapshot plumbing                                                   */
/* ------------------------------------------------------------------ */

export interface SnapshotResult {
  name: string;
  created: boolean;
  diff: ImageDiff | null;
  baselinePath: string;
  actualPath: string;
}

/**
 * Writes the current raster and compares it to the stored baseline.
 *
 * Missing baselines are CREATED rather than failed, and reported as created,
 * so the first run of a new page records a snapshot a human can then review
 * instead of blocking the suite on a file that does not exist yet.
 */
export async function snapshot(
  name: string,
  raster: Raster,
  baselineDir: string,
  outputDir: string,
): Promise<SnapshotResult> {
  fs.mkdirSync(baselineDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });
  const baselinePath = path.join(baselineDir, `${name}.png`);
  const actualPath = path.join(outputDir, `${name}.png`);
  fs.writeFileSync(actualPath, raster.png);

  if (!fs.existsSync(baselinePath)) {
    fs.writeFileSync(baselinePath, raster.png);
    return { name, created: true, diff: null, baselinePath, actualPath };
  }
  const baseline = await decodePng(baselinePath);
  return { name, created: false, diff: diffRasters(baseline, raster), baselinePath, actualPath };
}
