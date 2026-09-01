/**
 * KUNDLI V40.1 — renderer v3 (`kundli-pdf-renderer-v3`).
 *
 * ============================================================================
 * KUNDLI_INV_RENDER_001 — THE RENDERER DERIVES NOTHING.
 * ============================================================================
 * This file draws a `KundliReportModelV2` and nothing else. It contains no
 * astrology: no sign arithmetic, no house arithmetic, no rule evaluation, no
 * sentence authoring, no rounding of a Jyotish quantity. Every string it draws
 * came from the model; every number it computes is a millimetre. If a fact is
 * wrong on the page, the fault is in the model, never here. The invariant is
 * enforced mechanically by tests/kundli-v40/render-invariant.spec.ts.
 *
 * Why v3 exists
 * -------------
 * Renderer v2 (jsPDF) cannot shape complex scripts. `सिंह` printed as
 * स + ि + ं + ह in logical order: the pre-base matra stayed after its
 * consonant. That is not a font bug and not a bug we could patch — jsPDF has
 * no OpenType layout engine at all. Renderer v3 runs pdfkit over fontkit,
 * whose HarfBuzz-derived Indic shaper applies the font's own GSUB/GPOS tables.
 * The reordering is therefore performed by the FONT, exactly as it is in a
 * browser, and no code in this repository reorders a codepoint.
 *
 * Renderer v2 is untouched and remains available for comparison.
 */

import { KundliError } from '../errors';
import { PaginationController } from '../layoutEngine';
import { loadKundliRenderAssets, type KundliRenderAssets } from '../renderAssets';
import { drawChartToPdf, type PdfChartSurface } from '../northIndianChart';
import type { ChartRenderModel } from '../chartModel';
import type { PdfRenderMetrics } from '../types';
import { V3, contentWidthMmV3, BASELINE_EM, type Rgb } from './tokensV3';
import { FontStack, type RunStyle, type TextFamily } from './pdf/fontStack';
import { PdfSurfaceV3, ptToMm, type LaidLine } from './pdf/surface';
import type {
  KundliReportModelV2, V2Block, V2Section,
  TableBlockV2, KvGridBlock, StatusListBlock, TimelineBlock, NotesAreaBlock,
  CalloutBlockV2, ChartBlockV2, CoverBlock, PartDividerBlock, SectionTitleBlock,
} from './reportBlocks';

export const RENDERER_V3_VERSION = 'kundli-pdf-renderer-v3';

const PW = V3.page.widthMm;
const PH = V3.page.heightMm;
const ML = V3.page.marginLeftMm;
const MR = V3.page.marginRightMm;
const MT = V3.page.marginTopMm;
const CW = contentWidthMmV3;
const BOTTOM = V3.page.contentBottomMm;

export interface RenderV3Options {
  maxPages?: number;
  assets?: KundliRenderAssets;
  fonts?: FontStack;
  fontsDir?: string;
  paperTint?: boolean;
  /** Fixed date so the same model produces the same bytes. */
  creationDate?: Date;
}

export interface RenderV3Result {
  buffer: Uint8Array;
  metrics: PdfRenderMetrics;
  pageTitles: string[];
  rendererVersion: string;
  /** Every distinct font face actually used, for the QA gate. */
  fontsUsed: string[];
}

const SERIF: RunStyle = { family: 'serif' };
const SERIF_BOLD: RunStyle = { family: 'serif', bold: true };
const SERIF_ITALIC: RunStyle = { family: 'serif', italic: true };
const SANS: RunStyle = { family: 'sans' };
const SANS_BOLD: RunStyle = { family: 'sans', bold: true };

interface TextOpts {
  size: number;
  style?: RunStyle;
  color?: Rgb;
  align?: 'left' | 'right' | 'center';
  lineMm?: number;
  trackingMm?: number;
}

export async function renderKundliPdfV3(
  report: KundliReportModelV2,
  options: RenderV3Options = {},
): Promise<RenderV3Result> {
  const fonts = options.fonts ?? FontStack.fromDisk(options.fontsDir);
  const assets: KundliRenderAssets = { ...loadKundliRenderAssets(), ...(options.assets ?? {}) };
  const paperTint = options.paperTint ?? true;
  const maxPages = options.maxPages ?? 44;

  const s = new PdfSurfaceV3({
    widthMm: PW,
    heightMm: PH,
    fonts,
    title: `Kundli — ${report.subject.name}`,
    subject: `CosmicTantra Master Kundli V40 · ${report.reportId}`,
    keywords: 'kundli, jyotish, vedic astrology, rashi, navamsha, vimshottari',
    creationDate: options.creationDate,
  });

  const fontsUsed = new Set<string>();

  /* ------------------------------------------------------------------ */
  /* Text engine                                                         */
  /* ------------------------------------------------------------------ */

  /**
   * Word-wraps `text` to `maxWidth` using SHAPED advance widths.
   *
   * Two properties matter. First, the width used to break a line is the width
   * the line will actually occupy, because the measurement runs the same
   * fontkit layout the drawing does — v2's Devanagari widths were guesses.
   * Second, no line is ever split inside a word, and a word is never split
   * inside a Devanagari cluster: the wrapper only ever cuts at whitespace, and
   * the character-level fallback for an over-wide token walks code points, not
   * bytes.
   */
  const layout = (text: string, maxWidth: number, size: number, style: RunStyle, tracking = 0): LaidLine[] => {
    const source = text.replace(/\r\n?/g, '\n');
    const out: LaidLine[] = [];

    for (const paragraph of source.split('\n')) {
      const tokens = paragraph.match(/\s+|\S+/g) ?? [];
      let lineText = '';
      let lineWidth = 0;

      const push = () => {
        const trimmed = lineText.replace(/\s+$/, '');
        if (trimmed.length === 0) return;
        out.push(s.layoutSingle(trimmed, style, size, tracking));
        lineText = '';
        lineWidth = 0;
      };

      for (const token of tokens) {
        const isSpace = /^\s+$/.test(token);
        if (isSpace && lineText.length === 0) continue;
        const w = s.measureMm(token, style, size, tracking);

        if (!isSpace && w > maxWidth && lineText.length === 0) {
          // A single token wider than the column. Break it by code point so it
          // stays inside the margin. Devanagari clusters are kept whole by
          // refusing to cut before a combining mark or a virama sequence.
          const chars = [...token];
          let buf = '';
          for (let i = 0; i < chars.length; i += 1) {
            const next = buf + chars[i];
            const combiningFollows = i + 1 < chars.length
              && /[\u0900-\u0903\u093A-\u094F\u0951-\u0957\u0962\u0963\u200C\u200D]/.test(chars[i + 1]);
            if (s.measureMm(next, style, size, tracking) > maxWidth && buf.length > 0 && !combiningFollows) {
              out.push(s.layoutSingle(buf, style, size, tracking));
              buf = chars[i];
            } else {
              buf = next;
            }
          }
          if (buf.length > 0) { lineText = buf; lineWidth = s.measureMm(buf, style, size, tracking); }
          continue;
        }

        if (!isSpace && lineWidth + w > maxWidth && lineText.length > 0) push();
        lineText += token;
        lineWidth += w;
      }
      push();
    }

    return out.length > 0 ? out : [s.layoutSingle('', style, size, tracking)];
  };

  const defaultLineMm = (size: number): number => {
    if (size <= V3.typography.sizes.micro) return V3.spacing.microLineMm;
    if (size <= V3.typography.sizes.small) return V3.spacing.tightLineMm;
    return V3.spacing.lineMm;
  };

  /** Baseline of the first line inside a box whose top is at `y`. */
  const firstBaseline = (y: number, size: number): number => y + ptToMm(size * BASELINE_EM);

  const drawLines = (lines: LaidLine[], x: number, y: number, width: number, opts: TextOpts): void => {
    const style = opts.style ?? SERIF;
    const lineMm = opts.lineMm ?? defaultLineMm(opts.size);
    const color = opts.color ?? V3.colors.ink;
    lines.forEach((line, i) => {
      let cx = x;
      if (opts.align === 'right') cx = x + width - line.widthMm;
      else if (opts.align === 'center') cx = x + (width - line.widthMm) / 2;
      for (const run of line.runs) fontsUsed.add(run.role);
      s.drawLine(line, cx, firstBaseline(y, opts.size) + i * lineMm, {
        size: opts.size, style, color, trackingMm: opts.trackingMm,
      });
    });
  };

  const drawText = (text: string, x: number, y: number, width: number, opts: TextOpts): number => {
    const style = opts.style ?? SERIF;
    const lineMm = opts.lineMm ?? defaultLineMm(opts.size);
    const lines = layout(text, width, opts.size, style, opts.trackingMm ?? 0);
    drawLines(lines, x, y, width, { ...opts, lineMm });
    controller.recordChars(text.length);
    return lines.length * lineMm;
  };

  const measureText = (text: string, width: number, size: number, style: RunStyle, lineMm?: number, tracking = 0): number =>
    layout(text, width, size, style, tracking).length * (lineMm ?? defaultLineMm(size));

  /** Small letter-spaced uppercase label — the scholarly running voice. */
  const drawLabel = (text: string, x: number, y: number, width: number, color: Rgb, align?: 'left' | 'right' | 'center'): number => {
    const size = V3.typography.sizes.micro;
    return drawText(text.toUpperCase(), x, y, width, {
      size, style: SANS, color, align,
      lineMm: V3.spacing.microLineMm,
      trackingMm: V3.typography.smallCapsTrackingMm,
    });
  };

  /* ------------------------------------------------------------------ */
  /* Page chrome                                                         */
  /* ------------------------------------------------------------------ */

  /** Section identifiers, by page. Internal index: never localised. */
  const pageTitles: string[] = [];
  /** The same thing as the reader sees it. Localised, drawn in the header. */
  const pageHeadings: string[] = [];
  let runningTitle = '';
  let runningHeading = '';

  const paintPaper = () => {
    if (!paperTint) return;
    s.fillRect(0, 0, PW, PH, V3.colors.parchment);
  };

  const createPage = () => {
    s.addPage();
    paintPaper();
    pageTitles.push(runningTitle);
    pageHeadings.push(runningHeading);
  };

  const controller = new PaginationController({
    maxPages,
    pageHeightMm: PH,
    pageWidthMm: PW,
    marginMm: MT,
    contentBottomMm: BOTTOM,
  });

  /* ------------------------------------------------------------------ */
  /* Ornament                                                            */
  /* ------------------------------------------------------------------ */

  const drawMotif = (cx: number, y: number, w: number) => {
    const c = V3.colors.gold;
    s.line(cx - w / 2, y, cx - 5.5, y, c, V3.rule.hairlineMm);
    s.line(cx + 5.5, y, cx + w / 2, y, c, V3.rule.hairlineMm);
    const r = 2.2;
    s.polygon([[cx - r, y], [cx, y - r], [cx + r, y], [cx, y + r]], c, 'stroke', V3.rule.hairlineMm);
  };

  const drawCornerMarks = (inset: number) => {
    const c = V3.colors.goldFaint;
    const m = V3.motif.cornerMarkMm;
    const pts: [number, number, number, number][] = [
      [inset, inset, inset + m, inset], [inset, inset, inset, inset + m],
      [PW - inset, inset, PW - inset - m, inset], [PW - inset, inset, PW - inset, inset + m],
      [inset, PH - inset, inset + m, PH - inset], [inset, PH - inset, inset, PH - inset - m],
      [PW - inset, PH - inset, PW - inset - m, PH - inset], [PW - inset, PH - inset, PW - inset, PH - inset - m],
    ];
    for (const [x1, y1, x2, y2] of pts) s.line(x1, y1, x2, y2, c, V3.rule.hairlineMm);
  };

  /**
   * Status marks are DRAWN, never typed.
   *
   * A tick from a text font depends on that font's coverage; a drawn mark
   * always prints, scales with the page and survives a photocopy. Shape is the
   * carrier of meaning here — colour only reinforces it.
   */
  const drawStatusMark = (status: string, x: number, y: number, size = 2.6): void => {
    const cx = x + size / 2;
    const cy = y + size / 2 + 0.7;
    const r = size / 2;
    const w = 0.34;
    switch (status) {
      case 'PRESENT':
        s.line(cx - r, cy, cx - r * 0.25, cy + r * 0.8, V3.colors.vermilion, w);
        s.line(cx - r * 0.25, cy + r * 0.8, cx + r, cy - r, V3.colors.vermilion, w);
        break;
      case 'ABSENT':
        s.line(cx - r * 0.8, cy - r * 0.8, cx + r * 0.8, cy + r * 0.8, V3.colors.inkSoft, w);
        s.line(cx + r * 0.8, cy - r * 0.8, cx - r * 0.8, cy + r * 0.8, V3.colors.inkSoft, w);
        break;
      case 'SCHOLAR_JUDGEMENT':
      case 'INDETERMINATE':
        s.polygon([[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]], V3.colors.gold, 'stroke', w);
        break;
      case 'VALIDATION_PENDING':
        s.circle(cx, cy, r * 0.85, V3.colors.gold, 'stroke', w);
        break;
      default:
        s.line(cx - r, cy, cx + r, cy, V3.colors.inkFaint, w);
        break;
    }
  };

  /* ------------------------------------------------------------------ */
  /* Blocks                                                              */
  /* ------------------------------------------------------------------ */

  const renderCover = (b: CoverBlock): number => {
    s.fillRect(0, 0, PW, PH, V3.colors.parchmentDeep);
    s.strokeRect(11, 11, PW - 22, PH - 22, V3.colors.gold, V3.rule.lightMm);
    s.strokeRect(13.5, 13.5, PW - 27, PH - 27, V3.colors.goldFaint, V3.rule.hairlineMm);
    drawCornerMarks(17);

    // No raster marks on the cover. The supplied PNGs carry an opaque white
    // field that fights the parchment, and a scholarly title page earns its
    // authority from type and rule work, not from applied ornament. The
    // invocation carries the same meaning in text.
    let y = 42;
    drawText(b.invocation, ML, y, CW, {
      size: 15, style: { family: 'serif', bold: true }, color: V3.colors.vermilion,
      align: 'center', lineMm: 9,
    });
    y += 20;

    drawMotif(PW / 2, y, V3.motif.widthMm);
    y += 11;

    drawLabel(b.brand, ML, y, CW, V3.colors.gold, 'center');
    y += 8;
    y += drawText(b.documentTitle, ML, y, CW, {
      size: V3.typography.sizes.coverTitle, style: SERIF_BOLD,
      color: V3.colors.vermilion, align: 'center', lineMm: 14,
    });
    y += 3;
    drawLabel('Master Kundli · Pandit Workbench Edition', ML, y, CW, V3.colors.inkSoft, 'center');
    y += 13;

    s.line(ML + 32, y, PW - MR - 32, y, V3.colors.rule, V3.rule.hairlineMm);
    y += 9;

    y += drawText(b.subjectName, ML, y, CW, {
      size: V3.typography.sizes.coverName, style: SERIF_BOLD,
      color: V3.colors.ink, align: 'center', lineMm: 9.5,
    });
    y += 2;
    for (const line of b.birthLines) {
      y += drawText(line, ML, y, CW, {
        size: V3.typography.sizes.coverMeta, style: SERIF, color: V3.colors.inkSoft,
        align: 'center', lineMm: 5.8,
      });
    }
    y += 9;

    // Identity panel — the three facts a Pandit checks before anything else.
    const panelH = b.identityLines.length * 7.0 + 9;
    s.fillRect(ML + 12, y, CW - 24, panelH, V3.colors.parchment);
    s.strokeRect(ML + 12, y, CW - 24, panelH, V3.colors.goldFaint, V3.rule.hairlineMm);
    let py = y + 4.4;
    for (const line of b.identityLines) {
      py += drawText(line, ML + 16, py, CW - 32, {
        size: 11, style: SERIF, color: V3.colors.ink, align: 'center', lineMm: 7.0,
      });
    }
    y += panelH + 9;

    drawText(b.currentPeriodLine, ML, y, CW, {
      size: 10, style: SERIF_ITALIC, color: V3.colors.vermilionSoft, align: 'center', lineMm: 5.6,
    });
    y += 14;
    drawMotif(PW / 2, y, 38);

    let vy = PH - 58;
    s.line(ML + 22, vy, PW - MR - 22, vy, V3.colors.rule, V3.rule.hairlineMm);
    vy += 5.5;
    vy += drawText(`Report ID  ${b.reportId}`, ML, vy, CW, {
      size: 9, style: SANS_BOLD, color: V3.colors.ink, align: 'center', lineMm: 5.2,
    });
    for (const line of b.verificationBadge) {
      vy += drawText(line, ML, vy, CW, {
        size: V3.typography.sizes.micro, style: SANS, color: V3.colors.inkFaint,
        align: 'center', lineMm: V3.spacing.microLineMm,
      });
    }
    vy += 2.5;
    drawText(
      'This document states what was calculated, what a tradition says about it, and what was not calculated at all.',
      ML + 12, vy, CW - 24, {
        size: V3.typography.sizes.micro, style: SERIF_ITALIC, color: V3.colors.inkFaint,
        align: 'center', lineMm: V3.spacing.microLineMm,
      },
    );

    controller.advance(BOTTOM - MT - 1);
    return BOTTOM - MT - 1;
  };

  const renderPartDivider = (b: PartDividerBlock): number => {
    s.fillRect(0, 0, PW, PH, V3.colors.parchmentDeep);
    drawCornerMarks(17);
    let y = 80;
    drawMotif(PW / 2, y, V3.motif.widthMm);
    y += 15;
    y += drawText(b.title, ML, y, CW, {
      size: 20, style: SERIF_BOLD, color: V3.colors.vermilion, align: 'center', lineMm: 11,
    });
    y += 2;
    y += drawText(b.subtitle, ML, y, CW, {
      size: 12, style: SERIF_ITALIC, color: V3.colors.inkSoft, align: 'center', lineMm: 7,
    });
    y += 12;
    s.line(ML + 42, y, PW - MR - 42, y, V3.colors.rule, V3.rule.hairlineMm);
    y += 10;
    for (const c of b.contents) {
      y += drawText(c, ML + 42, y, CW - 84, {
        size: 9.4, style: SERIF, color: V3.colors.ink, lineMm: 6.4,
      });
    }
    y += 10;
    drawMotif(PW / 2, y, 38);
    controller.advance(BOTTOM - MT - 1);
    return BOTTOM - MT - 1;
  };

  const renderSectionTitle = (b: SectionTitleBlock): number => {
    const h = b.secondary ? 16.5 : 12;
    controller.ensureFits(h + V3.heading.minLinesAfterHeadingMm, createPage);
    const y = controller.cursorY;
    drawText(b.text, ML, y, CW * 0.74, {
      size: V3.typography.sizes.sectionTitle, style: SERIF_BOLD,
      color: V3.colors.vermilion, lineMm: 7.5,
    });
    if (b.tag) drawLabel(b.tag, ML + CW * 0.74, y + 2.2, CW * 0.26, V3.colors.inkFaint, 'right');
    if (b.secondary) {
      drawText(b.secondary, ML, y + 7.2, CW * 0.74, {
        size: 10, style: SERIF_ITALIC, color: V3.colors.inkSoft, lineMm: 5.4,
      });
    }
    s.line(ML, y + h - 3, PW - MR, y + h - 3, V3.colors.gold, V3.heading.sectionRuleWidthMm);
    controller.advance(h);
    return h;
  };

  const renderHeading = (level: 2 | 3, text: string): number => {
    const size = level === 2 ? V3.typography.sizes.h2 : V3.typography.sizes.h3;
    const style = level === 2 ? SERIF_BOLD : SANS_BOLD;
    const lineMm = level === 2 ? 6.4 : 5.4;
    const h = measureText(text, CW, size, style, lineMm) + V3.spacing.headingGapMm;
    controller.ensureFits(h + V3.heading.minLinesAfterHeadingMm, createPage);
    const y = controller.cursorY + 1.6;
    if (level === 2) {
      drawText(text, ML, y, CW, { size, style, color: V3.colors.ink, lineMm });
      s.line(ML, y + h - 2.4, ML + 16, y + h - 2.4, V3.colors.goldFaint, V3.rule.hairlineMm);
    } else {
      drawText(text, ML, y, CW, {
        size: V3.typography.sizes.h3 - 1.2, style: SANS_BOLD,
        color: V3.colors.vermilionSoft, lineMm,
        trackingMm: 0.15,
      });
    }
    controller.advance(h);
    return h;
  };

  const renderParagraph = (text: string, size: 'body' | 'small' | 'micro'): number => {
    const pt = size === 'body' ? V3.typography.sizes.body
      : size === 'small' ? V3.typography.sizes.small
        : V3.typography.sizes.micro;
    const lineMm = size === 'body' ? V3.spacing.lineMm
      : size === 'small' ? V3.spacing.tightLineMm
        : V3.spacing.microLineMm;
    const style: RunStyle = size === 'micro' ? SANS : SERIF;
    const color = size === 'micro' ? V3.colors.inkFaint : size === 'small' ? V3.colors.inkSoft : V3.colors.ink;

    // A long paragraph may legitimately outrun a page. It is placed line group
    // by line group so a break always lands BETWEEN lines, never through one,
    // and never leaves a single orphan line behind.
    const lines = layout(text, CW, pt, style);
    let consumed = 0;
    let i = 0;
    while (i < lines.length) {
      const remaining = Math.max(0, BOTTOM - controller.cursorY);
      let fitCount = Math.floor(remaining / lineMm);
      if (fitCount < 1) { controller.newPage(createPage); continue; }
      // Never strand one line of a multi-line paragraph at a page foot.
      if (fitCount === 1 && lines.length - i > 1 && i === 0) { controller.newPage(createPage); continue; }
      fitCount = Math.min(fitCount, lines.length - i);
      const chunk = lines.slice(i, i + fitCount);
      drawLines(chunk, ML, controller.cursorY, CW, { size: pt, style, color, lineMm });
      controller.recordChars(chunk.reduce((n, l) => n + l.charCount, 0));
      const h = chunk.length * lineMm;
      controller.advance(h);
      consumed += h;
      i += fitCount;
    }
    controller.advance(V3.spacing.blockGapMm);
    return consumed + V3.spacing.blockGapMm;
  };

  const renderBullets = (items: string[], size: 'body' | 'small'): number => {
    const pt = size === 'body' ? V3.typography.sizes.body : V3.typography.sizes.small;
    const lineMm = size === 'body' ? V3.spacing.lineMm : V3.spacing.tightLineMm;
    const indent = 5.5;
    let consumed = 0;
    for (const item of items) {
      const h = measureText(item, CW - indent, pt, SERIF, lineMm) + 1.2;
      controller.ensureFits(Math.min(h, controller.usableHeight - 1), createPage);
      const y = controller.cursorY;
      s.circle(ML + 1.5, y + ptToMm(pt * 0.62), 0.5, V3.colors.gold, 'fill');
      drawText(item, ML + indent, y, CW - indent, { size: pt, style: SERIF, color: V3.colors.ink, lineMm });
      controller.advance(h);
      consumed += h;
    }
    controller.advance(V3.spacing.blockGapMm);
    return consumed + V3.spacing.blockGapMm;
  };

  const renderKvGrid = (b: KvGridBlock): number => {
    let consumed = 0;
    if (b.title) consumed += renderHeading(3, b.title);
    const cols = b.columns;
    const gutter = 8;
    const colW = (CW - (cols - 1) * gutter) / cols;
    const labelW = colW * 0.44;
    const valueW = colW - labelW - 2;

    const cellHeights = b.items.map((it) => Math.max(
      measureText(it.label.toUpperCase(), labelW, V3.typography.sizes.micro, SANS,
        V3.spacing.microLineMm, V3.typography.smallCapsTrackingMm),
      measureText(it.value, valueW, V3.typography.sizes.small, SERIF, V3.spacing.tightLineMm)
      + (it.note ? measureText(it.note, valueW, V3.typography.sizes.micro, SANS, V3.spacing.microLineMm) : 0),
    ) + 2.0);

    for (let i = 0; i < b.items.length; i += cols) {
      const rowItems = b.items.slice(i, i + cols);
      const rowH = Math.max(...cellHeights.slice(i, i + cols));
      controller.ensureFits(Math.min(rowH, controller.usableHeight - 1), createPage);
      const y = controller.cursorY;
      rowItems.forEach((it, c) => {
        const x = ML + c * (colW + gutter);
        drawLabel(it.label, x, y + 0.5, labelW, V3.colors.inkFaint);
        const vh = drawText(it.value, x + labelW, y, valueW, {
          size: V3.typography.sizes.small, style: SERIF, color: V3.colors.ink, lineMm: V3.spacing.tightLineMm,
        });
        if (it.note) {
          drawText(it.note, x + labelW, y + vh, valueW, {
            size: V3.typography.sizes.micro, style: SANS, color: V3.colors.inkFaint, lineMm: V3.spacing.microLineMm,
          });
        }
      });
      s.line(ML, y + rowH - 0.9, PW - MR, y + rowH - 0.9, V3.colors.ruleFaint, V3.rule.hairlineMm);
      controller.advance(rowH);
      consumed += rowH;
    }
    controller.advance(V3.spacing.blockGapMm);
    return consumed + V3.spacing.blockGapMm;
  };

  /**
   * Tables are the working surface of the document, so they are set as a
   * scholarly table: no vertical rules, no boxed cells, a gold rule under the
   * header and hairlines between rows. Rows are never split; the header
   * repeats on every continuation page.
   */
  const renderTable = (b: TableBlockV2): number => {
    const n = b.headers.length;
    const widths = (b.widths && b.widths.length === n)
      ? b.widths.map((w) => w * CW)
      : new Array<number>(n).fill(CW / n);
    const align = b.align ?? new Array<'left'>(n).fill('left');
    const pad = V3.spacing.tableCellPadMm;
    const size = V3.typography.sizes.table;

    // The header is measured with the SAME size and tracking it is drawn
    // with. Measuring untracked text and drawing it tracked is how a header
    // silently wraps to two lines and gets clipped by the rule beneath it.
    const headerTracking = V3.typography.tableHeaderTrackingMm;
    const rowHeight = (cells: string[], header: boolean): number => {
      const style: RunStyle = header ? SANS : SERIF;
      const pt = header ? V3.typography.sizes.tableHeader : size;
      const lead = header ? V3.spacing.microLineMm : V3.spacing.tightLineMm;
      let max = header ? 5.8 : V3.spacing.tableRowMinMm;
      cells.forEach((cell, i) => {
        const text = header ? cell.toUpperCase() : cell;
        const h = measureText(text, widths[i] - 2 * pad, pt, style, lead, header ? headerTracking : 0)
          + 2 * pad * (header ? 1.0 : 0.8);
        if (h > max) max = h;
      });
      return max;
    };

    const headerH = rowHeight(b.headers, true);
    let consumed = 0;

    const drawHeaderRow = () => {
      const y = controller.cursorY;
      let x = ML;
      b.headers.forEach((cell, i) => {
        drawText(cell.toUpperCase(), x + pad, y + pad * 0.5, widths[i] - 2 * pad, {
          size: V3.typography.sizes.tableHeader, style: SANS, color: V3.colors.inkSoft,
          align: align[i], lineMm: V3.spacing.microLineMm,
          trackingMm: headerTracking,
        });
        x += widths[i];
      });
      s.line(ML, y + headerH, PW - MR, y + headerH, V3.colors.tableHeaderRule, 0.35);
      controller.advance(headerH);
      consumed += headerH;
    };

    const drawBodyRow = (cells: string[], h: number, bg?: Rgb) => {
      const y = controller.cursorY;
      if (bg) s.fillRect(ML, y, CW, h, bg);
      let x = ML;
      cells.forEach((cell, i) => {
        drawText(cell, x + pad, y + pad * 0.55, widths[i] - 2 * pad, {
          size, style: SERIF, color: V3.colors.ink,
          align: align[i], lineMm: V3.spacing.tightLineMm,
        });
        x += widths[i];
      });
      s.line(ML, y + h, PW - MR, y + h, V3.colors.ruleFaint, V3.rule.hairlineMm);
      controller.advance(h);
      consumed += h;
    };

    controller.ensureFits(Math.min(headerH + V3.spacing.tableRowMinMm * 2, controller.usableHeight - 1), createPage);
    drawHeaderRow();

    const highlight = new Set(b.highlightRows ?? []);
    b.rows.forEach((row, i) => {
      const h = rowHeight(row, false);
      if (controller.cursorY + h > BOTTOM) {
        controller.newPage(createPage);
        drawHeaderRow();
      }
      const bg = highlight.has(i)
        ? V3.colors.highlightFill
        : (i % 2 === 1 ? V3.colors.tableZebra : undefined);
      drawBodyRow(row, h, bg);
    });

    if (b.caption) consumed += renderParagraph(b.caption, 'micro');
    if (b.footnote) consumed += renderParagraph(b.footnote, 'micro');
    controller.advance(V3.spacing.blockGapMm);
    return consumed + V3.spacing.blockGapMm;
  };

  const renderStatusList = (b: StatusListBlock): number => {
    let consumed = 0;
    if (b.title) consumed += renderHeading(3, b.title);
    const glyphW = 6.5;
    const xrefW = 32;
    const labelW = 54;
    const noteW = CW - glyphW - xrefW - labelW - 5;

    for (const it of b.items) {
      const statusWord = it.statusText ?? it.status.replace(/_/g, ' ').toLowerCase();
      const noteText = it.note ? `${statusWord} — ${it.note}` : statusWord;
      const h = Math.max(
        measureText(it.label, labelW, V3.typography.sizes.small, SERIF_BOLD, V3.spacing.tightLineMm),
        measureText(noteText, noteW, V3.typography.sizes.small, SERIF, V3.spacing.tightLineMm),
        V3.spacing.tightLineMm,
      ) + 1.8;
      controller.ensureFits(Math.min(h, controller.usableHeight - 1), createPage);
      const y = controller.cursorY;
      drawStatusMark(it.status, ML, y);
      drawText(it.label, ML + glyphW, y, labelW, {
        size: V3.typography.sizes.small, style: SERIF_BOLD, color: V3.colors.ink, lineMm: V3.spacing.tightLineMm,
      });
      drawText(noteText, ML + glyphW + labelW + 3, y, noteW, {
        size: V3.typography.sizes.small, style: SERIF, color: V3.colors.inkSoft, lineMm: V3.spacing.tightLineMm,
      });
      if (it.xref) drawLabel(it.xref, PW - MR - xrefW, y + 0.4, xrefW, V3.colors.inkFaint, 'right');
      controller.advance(h);
      consumed += h;
    }
    controller.advance(V3.spacing.blockGapMm);
    return consumed + V3.spacing.blockGapMm;
  };

  const renderTimeline = (b: TimelineBlock): number => {
    const labelW = 26;
    const dateW = 44;
    const barX = ML + labelW + dateW;
    const barMax = CW - labelW - dateW - 14;
    const maxYears = Math.max(1, ...b.periods.map((p) => p.years));
    let consumed = 0;

    for (const period of b.periods) {
      const h = 6.8;
      controller.ensureFits(h, createPage);
      const y = controller.cursorY;
      if (period.current) s.fillRect(ML - 1.5, y - 0.6, CW + 3, h, V3.colors.highlightFill);
      drawText(period.label, ML, y, labelW, {
        size: V3.typography.sizes.small, style: period.current ? SERIF_BOLD : SERIF,
        color: V3.colors.ink, lineMm: V3.spacing.tightLineMm,
      });
      drawText(`${period.start} to ${period.end}`, ML + labelW, y + 0.3, dateW, {
        size: V3.typography.sizes.micro, style: SANS, color: V3.colors.inkSoft, lineMm: V3.spacing.microLineMm,
      });
      const w = Math.max(1.5, (period.years / maxYears) * barMax);
      s.fillRect(barX, y + 1.1, w, 2.4, period.current ? V3.colors.vermilion : V3.colors.goldFaint);
      drawText(`${period.years.toFixed(0)}y`, barX + w + 1.6, y + 0.3, 12, {
        size: V3.typography.sizes.micro, style: SANS, color: V3.colors.inkFaint, lineMm: V3.spacing.microLineMm,
      });
      controller.advance(h);
      consumed += h;
    }
    consumed += renderParagraph(b.caption, 'micro');
    return consumed;
  };

  const renderNotesArea = (b: NotesAreaBlock): number => {
    const lineGap = 7.6;
    const h = 7 + b.lines * lineGap;
    controller.ensureFits(Math.min(h, controller.usableHeight - 1), createPage);
    const y = controller.cursorY;
    drawLabel(b.title, ML, y, CW, V3.colors.vermilionSoft);
    for (let i = 0; i < b.lines; i += 1) {
      const ly = y + 7 + i * lineGap + 3;
      s.line(ML, ly, PW - MR, ly, V3.colors.notesRule, V3.rule.hairlineMm);
    }
    controller.advance(h);
    return h;
  };

  const renderCallout = (b: CalloutBlockV2): number => {
    const inner = CW - 12;
    const titleH = b.title
      ? measureText(b.title, inner, V3.typography.sizes.small, SANS_BOLD, V3.spacing.tightLineMm) + 1.2
      : 0;
    const textH = measureText(b.text, inner, V3.typography.sizes.small, SERIF, V3.spacing.tightLineMm);
    const h = titleH + textH + 6.5;
    controller.ensureFits(Math.min(h, controller.usableHeight - 1), createPage);
    const y = controller.cursorY;
    s.fillRect(ML, y, CW, h, b.tone === 'info' ? V3.colors.calloutInfo : V3.colors.calloutWarn);
    s.line(ML, y, ML, y + h, b.tone === 'info' ? V3.colors.rule : V3.colors.vermilionSoft, V3.rule.lightMm);
    let ty = y + 3;
    if (b.title) {
      ty += drawText(b.title.toUpperCase(), ML + 6, ty, inner, {
        size: V3.typography.sizes.micro, style: SANS, color: V3.colors.vermilion,
        lineMm: V3.spacing.microLineMm, trackingMm: V3.typography.smallCapsTrackingMm,
      }) + 1.2;
    }
    drawText(b.text, ML + 6, ty, inner, {
      size: V3.typography.sizes.small, style: SERIF, color: V3.colors.ink, lineMm: V3.spacing.tightLineMm,
    });
    controller.advance(h);
    controller.advance(V3.spacing.blockGapMm);
    return h + V3.spacing.blockGapMm;
  };

  /**
   * Chart adapter.
   *
   * `drawChartToPdf` is the shared, tested chart geometry used by v1 and v2 —
   * it is NOT reimplemented here, because a second implementation of the chart
   * would be a second thing that can be wrong. It speaks a tiny jsPDF-shaped
   * surface, so this adapter translates that surface onto pdfkit. Grey levels
   * (0-255) become RGB; a jsPDF text baseline becomes a pdfkit alphabetic
   * baseline; `align: 'center'` centres on x.
   */
  const chartSurface = (): PdfChartSurface => {
    let drawColor: Rgb = [0, 0, 0];
    let textColor: Rgb = [0, 0, 0];
    let lineWidth = 0.2;
    let fontSize = 8;
    let family: TextFamily = 'sans';
    /**
     * The chart module speaks in 0-255 grey levels. Mapping them straight to
     * neutral grey would put cold ink on a warm page, so each level is
     * interpolated along the document's own ink ramp: 0 is the warm near-black
     * used for body text, 255 is the parchment itself.
     */
    const grey = (v: number): Rgb => {
      const t = Math.min(1, Math.max(0, v / 255));
      const a = V3.colors.ink;
      const bb = V3.colors.parchment;
      return [
        Math.round(a[0] + (bb[0] - a[0]) * t),
        Math.round(a[1] + (bb[1] - a[1]) * t),
        Math.round(a[2] + (bb[2] - a[2]) * t),
      ];
    };

    return {
      setDrawColor: (v: number) => { drawColor = grey(v); },
      setTextColor: (v: number) => { textColor = grey(v); },
      setLineWidth: (v: number) => { lineWidth = v; },
      setFontSize: (v: number) => { fontSize = v; },
      setFont: (name: string) => { family = name === 'devanagari' ? 'sans' : 'sans'; },
      line: (x1, y1, x2, y2) => s.line(x1, y1, x2, y2, drawColor, lineWidth),
      rect: (x, y, w, h) => s.strokeRect(x, y, w, h, drawColor, lineWidth),
      text: (t, x, y, opts) => {
        // The chart model positions labels by their CENTRE and by a baseline.
        const style: RunStyle = { family };
        const line = s.layoutSingle(t, style, fontSize);
        for (const run of line.runs) fontsUsed.add(run.role);
        const cx = opts?.align === 'center' ? x - line.widthMm / 2 : x;
        s.drawLine(line, cx, y, { size: fontSize, style, color: textColor });
        controller.recordChars(t.length);
      },
      getTextWidth: (t: string) => s.measureMm(t, { family }, fontSize),
    };
  };

  const renderChart = (b: ChartBlockV2): number => {
    const model = b.data as ChartRenderModel | undefined;
    if (!model || !Array.isArray(model.houses) || model.houses.length !== 12) {
      return renderCallout({
        kind: 'callout', tone: 'warning',
        title: 'Chart not drawn',
        text: 'The chart render model was incomplete, so no diagram was drawn. This is reported rather than approximated.',
      });
    }
    const side = b.size === 'hero' ? V3.chart.heroSizeMm : V3.chart.inlineSizeMm;
    // The facts line is measured, not assumed to be one line. A bilingual
    // locale doubles its length ("लग्न — Ascendant: सिंह — Leo 12°06′ ...")
    // and a hardcoded height let the second line run straight through the
    // caption beneath it.
    const factsText = b.sideFacts && b.sideFacts.length > 0
      ? b.sideFacts.map((f) => `${f.label}: ${f.value}`).join('     ·     ')
      : '';
    const factsLineMm = 5.2;
    const factsH = factsText.length > 0
      ? measureText(factsText, CW, V3.typography.sizes.small, SERIF_BOLD, factsLineMm) + 1.3
      : 0;
    const capH = measureText(b.caption, CW, V3.chart.captionSize, SANS, V3.spacing.microLineMm);
    const h = side + 7 + factsH + capH + 2;
    controller.ensureFits(Math.min(h, controller.usableHeight - 1), createPage);
    const left = ML + (CW - side) / 2;
    const top = controller.cursorY + 3;

    drawChartToPdf(chartSurface(), model, left, top, {
      size: side,
      baseFontSize: V3.chart.baseFontSize,
      minFontSize: V3.chart.minFontSize,
      palette: V3.chart.palette,
      lagnaMarkerWidth: V3.chart.lagnaMarkerWidthMm,
      devFontAvailable: true,
    });

    let y = top + side + 4;
    if (factsText.length > 0) {
      drawText(factsText, ML, y, CW, {
        size: V3.typography.sizes.small, style: SERIF_BOLD, color: V3.colors.ink,
        align: 'center', lineMm: factsLineMm,
      });
      y += factsH;
    }
    drawText(b.caption, ML, y, CW, {
      size: V3.chart.captionSize, style: SANS, color: V3.colors.inkFaint,
      align: 'center', lineMm: V3.spacing.microLineMm,
    });
    controller.advance(h);
    return h;
  };

  const renderDivider = (): number => {
    const h = 4.5;
    controller.ensureFits(h, createPage);
    s.line(ML, controller.cursorY + 1.8, PW - MR, controller.cursorY + 1.8, V3.colors.ruleFaint, V3.rule.hairlineMm);
    controller.advance(h);
    return h;
  };

  const renderBlock = (block: V2Block): number => {
    switch (block.kind) {
      case 'cover': return renderCover(block);
      case 'partDivider': return renderPartDivider(block);
      case 'sectionTitle': return renderSectionTitle(block);
      case 'heading': return renderHeading(block.level, block.text);
      case 'paragraph': return renderParagraph(block.text, block.size ?? 'body');
      case 'bullets': return renderBullets(block.items, block.size ?? 'small');
      case 'kvGrid': return renderKvGrid(block);
      case 'table': return renderTable(block);
      case 'chart': return renderChart(block);
      case 'statusList': return renderStatusList(block);
      case 'timeline': return renderTimeline(block);
      case 'notesArea': return renderNotesArea(block);
      case 'callout': return renderCallout(block);
      case 'divider': return renderDivider();
      case 'spacer': {
        const h = Math.max(0.5, block.mm);
        controller.ensureFits(h, createPage);
        controller.advance(h);
        return h;
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* Document walk                                                       */
  /* ------------------------------------------------------------------ */

  try {
    paintPaper();
    pageTitles.push('Cover');

    report.sections.forEach((section: V2Section, index: number) => {
      if (section.status !== 'READY') return;
      if (section.blocks.length === 0) {
        throw new KundliError('KUNDLI_REPORT_INCOMPLETE', `section ${section.id} has no blocks`, { sectionId: section.id });
      }
      // The running head is display text and follows the locale, so a Hindi
      // page is not topped by an English strap. `section.title` stays the
      // identifier: pageTitles is an internal index that the pipeline and the
      // release gates resolve sections by, and it must not move with language.
      const titleBlock = section.blocks.find((b) => b.kind === 'sectionTitle');
      runningTitle = section.title;
      runningHeading = titleBlock && titleBlock.kind === 'sectionTitle' ? titleBlock.text : section.title;
      if (section.startsNewPage && index > 0) controller.newPage(createPage);
      pageTitles[controller.pageCount - 1] = section.title;
      pageHeadings[controller.pageCount - 1] = runningHeading;
      for (const block of section.blocks) renderBlock(block);
      controller.advance(V3.spacing.sectionGapMm);
    });
  } catch (e) {
    if (e instanceof KundliError) throw e;
    throw new KundliError('KUNDLI_PDF_RENDER_FAILED',
      `V40.1 PDF rendering failed unexpectedly: ${e instanceof Error ? e.message : String(e)}`,
      { cause: e instanceof Error ? `${e.message}\n${e.stack ?? ''}` : String(e) });
  }

  /* Chrome pass. Drawn last, when the page total is known, so "page 4 of 21"
   * is a fact rather than a guess. */
  const total = controller.pageCount;
  for (let page = 2; page <= total; page += 1) {
    s.switchToPage(page);
    const title = pageTitles[page - 1] ?? '';
    // The strap is display text and follows the locale; the divider test uses
    // the identifier, which must not move with language.
    const heading = pageHeadings[page - 1] || title;
    const isDivider = title === 'Scholar Appendix';
    if (!isDivider) {
      const size = V3.typography.sizes.footer;
      const head = s.layoutSingle(heading.toUpperCase(), SANS, size, V3.typography.smallCapsTrackingMm);
      for (const r of head.runs) fontsUsed.add(r.role);
      s.drawLine(head, ML, V3.page.headerBaselineMm, {
        size, style: SANS, color: V3.colors.inkFaint, trackingMm: V3.typography.smallCapsTrackingMm,
      });
      const name = s.layoutSingle(report.subject.name, SANS, size);
      s.drawLine(name, PW - MR - name.widthMm, V3.page.headerBaselineMm, {
        size, style: SANS, color: V3.colors.inkFaint,
      });
      s.line(ML, V3.page.headerBaselineMm + 2.2, PW - MR, V3.page.headerBaselineMm + 2.2,
        V3.colors.ruleFaint, V3.rule.hairlineMm);
    }
    const fsize = V3.typography.sizes.footer;
    const left = s.layoutSingle(`CosmicTantra · ${report.reportId}`, SANS, fsize);
    s.drawLine(left, ML, V3.page.footerBaselineMm, { size: fsize, style: SANS, color: V3.colors.inkFaint });
    const right = s.layoutSingle(`page ${page} of ${total}`, SANS, fsize);
    s.drawLine(right, PW - MR - right.widthMm, V3.page.footerBaselineMm, {
      size: fsize, style: SANS, color: V3.colors.inkFaint,
    });
  }

  const metrics: PdfRenderMetrics = {
    pageCount: controller.pageCount,
    placedCharsByPage: controller.charsByPage,
    blocksRendered: controller.blockCount,
    sectionsRendered: report.sections.filter((sec) => sec.status === 'READY').length,
  };

  const buffer = await s.finish();
  return {
    buffer,
    metrics,
    pageTitles,
    rendererVersion: RENDERER_V3_VERSION,
    fontsUsed: [...fontsUsed].sort(),
  };
}
