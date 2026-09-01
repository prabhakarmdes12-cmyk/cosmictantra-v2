/**
 * Kundli pipeline — jsPDF renderer.
 *
 * Draws ONLY the report model (typed blocks). No astrology data is computed
 * here; no interpretation text is authored here. Pagination is exclusively
 * owned by the PaginationController.
 */

import { jsPDF } from 'jspdf';
import { KundliError } from './errors';
import { PaginationController } from './layoutEngine';
import { loadKundliRenderAssets, KundliRenderAssets } from './renderAssets';
import { KUNDLI_PIPELINE_CONFIG } from './config';
import type { KundliReportModel, ReportBlock, PdfRenderMetrics, ReportSection } from './types';
import { drawChartToPdf } from './northIndianChart';
import type { PdfChartSurface } from './northIndianChart';
import type { ChartRenderModel } from './chartModel';

const PAGE_WIDTH = 210;   // A4 mm
const PAGE_HEIGHT = 297;
const MARGIN = 14;
const CONTENT_BOTTOM = 280;
const FOOTER_TEXT = 'www.cosmictantra.chiti.tech';
const FONT_BODY = 9.5;
const FONT_SMALL = 8;
const LINE_H = 4.6;
const SECTION_GAP = 7;
const BLOCK_GAP = 2.2;

export interface RenderResult {
  buffer: Uint8Array;
  metrics: PdfRenderMetrics;
}

/**
 * Registers a Devanagari TTF (public/fonts/*) with jsPDF.
 * Returns false when the font is unavailable (caller falls back to Latin
 * font — the pipeline's PDF validator rejects blank pages, so a missing
 * Devanagari font can never silently ship garbage).
 */
export async function registerDevFont(
  doc: jsPDF,
  url: string,
  fontName: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const res = await fetchImpl(url);
    if (!res.ok) return false;
    const buf = await res.arrayBuffer();
    const b64 = arrayBufferToBase64(buf);
    doc.addFileToVFS(`${fontName}.ttf`, b64);
    doc.addFont(`${fontName}.ttf`, fontName, 'normal');
    doc.addFont(`${fontName}.ttf`, fontName, 'bold');
    return true;
  } catch {
    return false;
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 32768) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 32768)));
  }
  return btoa(bin);
}

export interface RenderKundliOptions {
  locale: 'en' | 'hi';
  maxPages?: number;
  fonts?: { regular: string; bold: string };
  /**
   * Pre-loaded assets for Node/server contexts where fetch('/...') has no
   * server to hit. Browser callers omit this and the renderer fetches the
   * public URLs directly. See renderAssets.ts.
   */
  assets?: {
    devanagariRegularBase64?: string;
    ganesh256Base64?: string;
    cosmictantraSymbolBase64?: string;
  };
}

export async function renderKundliReportPdf(
  report: KundliReportModel,
  options: RenderKundliOptions,
): Promise<RenderResult> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Static assets: Node/server contexts have no dev server to fetch from, so
  // load them from disk (renderAssets.ts is bundle-safe for the browser).
  // Explicit options.assets always win (tests inject their own).
  const assets: KundliRenderAssets = { ...loadKundliRenderAssets(), ...(options.assets ?? {}) };
  const maxPages = options.maxPages ?? KUNDLI_PIPELINE_CONFIG.limits.maxPages;

  const controller = new PaginationController({
    maxPages,
    pageHeightMm: PAGE_HEIGHT,
    pageWidthMm: PAGE_WIDTH,
    marginMm: MARGIN,
    contentBottomMm: CONTENT_BOTTOM,
  });

  // Devanagari is needed for the cover invocation in BOTH locales (the
  // traditional "Shri Ganeshaya Namah" line), and for all text in 'hi'.
  // Node callers inject the TTF base64 via options.assets; the browser path
  // fetches the public URL.
  let devFontLoaded = false;
  if (assets.devanagariRegularBase64) {
    try {
      doc.addFileToVFS('NotoSansDevanagari-Regular.ttf', assets.devanagariRegularBase64);
      doc.addFont('NotoSansDevanagari-Regular.ttf', 'devanagari', 'normal');
      doc.addFont('NotoSansDevanagari-Regular.ttf', 'devanagari', 'bold');
      devFontLoaded = true;
    } catch {
      devFontLoaded = false;
    }
  }
  if (!devFontLoaded) {
    devFontLoaded = await registerDevFont(doc, '/fonts/NotoSansDevanagari-Regular.ttf', 'devanagari');
  }

  // Ganesh Vandana image (optional — skipped gracefully when unavailable;
  // the invocation text still renders on the cover).
  let ganeshBase64: string | null = assets.ganesh256Base64 ?? null;
  if (!ganeshBase64) {
    try {
      const res = await fetch('/images/ganesh_vandana_256.png');
      if (res.ok) {
        const buf = await res.arrayBuffer();
        ganeshBase64 = arrayBufferToBase64(buf);
      }
    } catch {
      ganeshBase64 = null;
    }
  }

  // CosmicTantra symbol-only emblem (opposite side of the Ganesh emblem on
  // the cover, mirroring the web banner). Optional — skipped gracefully.
  let symbolBase64: string | null = assets.cosmictantraSymbolBase64 ?? null;
  if (!symbolBase64) {
    try {
      const res = await fetch('/images/cosmictantra_symbol_256.png');
      if (res.ok) {
        const buf = await res.arrayBuffer();
        symbolBase64 = arrayBufferToBase64(buf);
      }
    } catch {
      symbolBase64 = null;
    }
  }

  // Latin text ALWAYS uses helvetica: it keeps pdfjs text-extraction of the
  // English titles intact (gate-4 validator depends on it) and avoids
  // rendering Latin through a Devanagari face. Devanagari is used only for
  // text that actually contains Devanagari characters.
  const hasDev = (text: string) => /[\u0900-\u097F]/.test(text);

  const drawChrome = (page: number) => {
    const font = doc.getFont();
    const fontSize = doc.getFontSize();
    const textColor = doc.getTextColor();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120);
    doc.text(FOOTER_TEXT, MARGIN, PAGE_HEIGHT - 8);
    doc.text(`${report.reportId} — page ${page}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 8, { align: 'right' });
    doc.setFont(font.fontName, font.fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(textColor);
  };

  const textFont = (text: string, bold: boolean) => {
    const f = hasDev(text) && devFontLoaded ? 'devanagari' : 'helvetica';
    doc.setFont(f, bold ? 'bold' : 'normal');
  };

  const renderHeading = (b: Extract<ReportBlock, { kind: 'heading' }>): number => {
    const size = b.level === 1 ? 17 : b.level === 2 ? 12.5 : 10;
    textFont(b.text, true);
    doc.setFontSize(size);
    doc.setTextColor(30);
    const lines = doc.splitTextToSize(b.text, PAGE_WIDTH - 2 * MARGIN);
    const h = lines.length * (size * 0.5) + 3;
    controller.ensureFits(h, () => doc.addPage(), drawChrome);
    doc.text(lines, MARGIN, controller.cursorY + size * 0.5);
    controller.recordChars(b.text.length);
    controller.advance(h);
    return h;
  };

  const renderParagraph = (b: Extract<ReportBlock, { kind: 'paragraph' }>): number => {
    textFont(b.text, false);
    doc.setFontSize(FONT_BODY);
    doc.setTextColor(60);
    const lines = doc.splitTextToSize(b.text, PAGE_WIDTH - 2 * MARGIN);
    const h = lines.length * LINE_H;
    controller.ensureFits(h, () => doc.addPage(), drawChrome);
    doc.text(lines, MARGIN, controller.cursorY + FONT_BODY * 0.36);
    controller.recordChars(b.text.length);
    controller.advance(h);
    return h;
  };

  const renderKeyValue = (b: Extract<ReportBlock, { kind: 'keyValue' }>): number => {
    doc.setFontSize(FONT_SMALL);
    textFont(b.label, true);
    const labelW = doc.getTextWidth(b.label) + 3;
    textFont(`${b.label}${b.value}`, false);
    const lines = doc.splitTextToSize(`${b.label}  ${b.value}`, PAGE_WIDTH - 2 * MARGIN - 4);
    const h = Math.max(lines.length * LINE_H, LINE_H);
    controller.ensureFits(h, () => doc.addPage(), drawChrome);
    // label in bold, then value
    textFont(b.label, true);
    doc.setTextColor(40);
    doc.text(doc.splitTextToSize(b.label, labelW), MARGIN, controller.cursorY + FONT_SMALL * 0.36);
    textFont(b.value, false);
    doc.setTextColor(60);
    const valueLines = doc.splitTextToSize(b.value, PAGE_WIDTH - 2 * MARGIN - labelW - 4);
    doc.text(valueLines, MARGIN + labelW, controller.cursorY + FONT_SMALL * 0.36);
    controller.recordChars(b.label.length + b.value.length);
    controller.advance(h);
    return h;
  };

  const renderTable = (b: Extract<ReportBlock, { kind: 'table' }>): number => {
    const colW = (PAGE_WIDTH - 2 * MARGIN) / b.headers.length;
    doc.setFontSize(FONT_SMALL);
    // Measure rows
    const rowHeights: number[] = [];
    for (const row of b.rows) {
      let maxLines = 1;
      row.forEach((cell, i) => {
        textFont(cell, false);
        const lines = doc.splitTextToSize(cell, colW - 2);
        maxLines = Math.max(maxLines, lines.length);
      });
      rowHeights.push(maxLines * LINE_H + 1.6);
    }
    const headerH = LINE_H + 1.6;
    const totalH = headerH + rowHeights.reduce((a, h) => a + h, 0);

    // If the table does not fit, start it on a fresh page; if it still
    // does not fit, draw it row by row (rows are small).
    controller.ensureFits(Math.min(totalH, controller.usableHeight - 1), () => doc.addPage(), drawChrome);

    let y = controller.cursorY;
    const drawRow = (cells: string[], rowH: number, bold: boolean, fill?: [number, number, number]) => {
      if (y + rowH > CONTENT_BOTTOM) {
        controller.newPage(() => doc.addPage(), drawChrome);
        y = controller.cursorY;
      }
      if (fill) {
        doc.setFillColor(...fill);
        doc.rect(MARGIN, y, PAGE_WIDTH - 2 * MARGIN, rowH, 'F');
      }
      cells.forEach((cell, i) => {
        textFont(cell, bold);
        doc.setTextColor(40);
        const lines = doc.splitTextToSize(cell, colW - 2);
        doc.text(lines, MARGIN + i * colW + 1, y + FONT_SMALL * 0.36);
        controller.recordChars(cell.length);
      });
      y += rowH;
    };

    drawRow(b.headers, headerH, true, [235, 235, 235]);
    const highlight = b.highlightRows ?? [];
    b.rows.forEach((row, i) => {
      drawRow(row, rowHeights[i], false, highlight.includes(i) ? [255, 244, 204] : undefined);
    });

    const consumed = y - controller.cursorY;
    controller.advance(Math.max(consumed, 1));
    return consumed;
  };

  /**
   * Vector chart block.
   *
   * Draws a validated ChartRenderModel with PDF line and text primitives —
   * never a raster image. If the block carries no render model the chart is
   * skipped and counted as such, rather than invented from loose fields.
   */
  const renderChart = (b: Extract<ReportBlock, { kind: 'chart' }>, devFontAvailable: boolean): number => {
    const model = b.data as ChartRenderModel | undefined;
    if (!model || !Array.isArray(model.houses) || model.houses.length !== 12) {
      // A chart drawn from incomplete data is indistinguishable from a real
      // one, so an unusable model must never be drawn.
      return 0;
    }
    // A4 page width is 210mm; 130mm leaves the chart legible and centred
    // inside the text column without crowding it.
    const side = 130;
    const h = side + 16;
    controller.ensureFits(h, () => doc.addPage(), drawChrome);
    const left = MARGIN + (PAGE_WIDTH - 2 * MARGIN - side) / 2;
    const top = controller.cursorY + 6;

    drawChartToPdf(doc as unknown as PdfChartSurface, model, left, top, {
      size: side,
      baseFontSize: 9,
      minFontSize: 6,
      devFontAvailable,
    });

    // A caption states, in words, what the drawing encodes.
    textFont(model.chartName, false);
    doc.setFontSize(7);
    doc.setTextColor(110);
    doc.text(
      `Lagna is marked by the bold rule beneath house 1. Retrograde grahas carry a rule beneath their abbreviation. Chart data ${model.chartModelVersion}.`,
      left, top + side + 8, { align: 'left' },
    );
    controller.recordChars(model.textual.join(' ').length);
    controller.advance(h);
    return h;
  };

  const renderCallout = (b: Extract<ReportBlock, { kind: 'callout' }>): number => {
    textFont(b.text, false);
    doc.setFontSize(FONT_BODY);
    doc.setTextColor(60);
    const lines = doc.splitTextToSize(b.text, PAGE_WIDTH - 2 * MARGIN - 8);
    const h = lines.length * LINE_H + 5;
    controller.ensureFits(h, () => doc.addPage(), drawChrome);
    const color = b.tone === 'warning' ? [252, 231, 231] : b.tone === 'remedy' ? [236, 252, 231] : [235, 244, 252];
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(MARGIN, controller.cursorY - 1, PAGE_WIDTH - 2 * MARGIN, h, 'F');
    doc.text(lines, MARGIN + 4, controller.cursorY + FONT_BODY * 0.36);
    controller.recordChars(b.text.length);
    controller.advance(h);
    return h;
  };

  const renderDivider = (): number => {
    doc.setDrawColor(200);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, controller.cursorY + 1, PAGE_WIDTH - MARGIN, controller.cursorY + 1);
    controller.advance(3);
    return 3;
  };

  const renderBlock = (b: ReportBlock): number => {
    switch (b.kind) {
      case 'heading': return renderHeading(b);
      case 'paragraph': return renderParagraph(b);
      case 'keyValue': return renderKeyValue(b);
      case 'table': return renderTable(b);
      case 'chart': return renderChart(b, devFontLoaded);
      case 'callout': return renderCallout(b);
      case 'divider': return renderDivider();
      case 'pageFooter': return 0;
    }
  };

  try {
    drawChrome(1);
    for (const section of report.sections) {
      if (section.status === 'FAILED') {
        throw new KundliError('KUNDLI_REPORT_INCOMPLETE', `section ${section.id} is FAILED`, { sectionId: section.id });
      }
      if (section.status !== 'READY') continue;
      // The cover is its own title page — Ganesh Vandana, then the blocks.
      // Layout mirrors the web banner: Ganesh emblem left, invocation
      // centered, CosmicTantra symbol right.
      if (section.id === 'cover') {
        const emblemSize = 36;
        if (ganeshBase64) {
          doc.addImage(ganeshBase64, 'PNG', MARGIN, 28, emblemSize, emblemSize);
        }
        if (symbolBase64) {
          doc.addImage(symbolBase64, 'PNG', PAGE_WIDTH - MARGIN - emblemSize, 28, emblemSize, emblemSize);
        }
        // Invocation line centred between the two emblems.
        if (devFontLoaded) {
          doc.setFont('devanagari', 'bold');
        } else {
          doc.setFont('helvetica', 'bold');
        }
        doc.setFontSize(devFontLoaded ? 13 : 11);
        doc.setTextColor(90);
        const invocation = devFontLoaded ? '॥ श्री गणेशाय नमः ॥' : 'Shri Ganeshaya Namah';
        doc.text(invocation, PAGE_WIDTH / 2, ganeshBase64 ? 74 : 40, { align: 'center' });
        controller.recordChars(invocation.length);
        controller.advance(ganeshBase64 ? 64 : 30);
      } else {
        renderHeading({ kind: 'heading', level: 2, text: section.title });
      }
      let blocksInSection = 0;
      for (const block of section.blocks) {
        // Invocation paragraph is drawn by the cover special-case above.
        if (block.kind === 'paragraph' && /^॥.*॥$/.test(block.text)) continue;
        renderBlock(block);
        blocksInSection += 1;
      }
      if (blocksInSection === 0) {
        throw new KundliError('KUNDLI_REPORT_INCOMPLETE', `section ${section.id} has no blocks`, { sectionId: section.id });
      }
      controller.advance(SECTION_GAP);
    }
  } catch (e) {
    if (e instanceof KundliError) throw e;
    throw new KundliError('KUNDLI_PDF_RENDER_FAILED', 'PDF rendering failed unexpectedly', { cause: String(e) });
  }

  const metrics: PdfRenderMetrics = {
    pageCount: controller.pageCount,
    placedCharsByPage: controller.charsByPage,
    blocksRendered: controller.blockCount,
    sectionsRendered: report.sections.filter((s: ReportSection) => s.status === 'READY').length,
  };

  const out = doc.output('arraybuffer');
  return { buffer: new Uint8Array(out), metrics };
}
