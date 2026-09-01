/**
 * KUNDLI V40 — renderer v2.
 *
 * Draws a KundliReportModelV2 and nothing else. It computes no astrology, it
 * authors no sentence, and it is the only place millimetres are turned into
 * marks on a page. Every measurement comes from KundliPdfTokens.
 *
 * The v1 renderer (renderer.ts) is untouched and remains the regression
 * reference until V40 is accepted.
 */

import { jsPDF } from 'jspdf';
import { KundliError } from '../errors';
import { PaginationController } from '../layoutEngine';
import { loadKundliRenderAssets, type KundliRenderAssets } from '../renderAssets';
import { drawChartToPdf, type PdfChartSurface } from '../northIndianChart';
import type { ChartRenderModel } from '../chartModel';
import type { PdfRenderMetrics } from '../types';
import { KundliPdfTokens as T, contentWidthMm } from './tokens';
import type {
  KundliReportModelV2, V2Block, V2Section,
  TableBlockV2, KvGridBlock, StatusListBlock, TimelineBlock, NotesAreaBlock,
  CalloutBlockV2, ChartBlockV2, CoverBlock, PartDividerBlock, SectionTitleBlock,
} from './reportBlocks';

const PW = T.page.widthMm;
const PH = T.page.heightMm;
const ML = T.page.marginLeftMm;
const MR = T.page.marginRightMm;
const MT = T.page.marginTopMm;
const CW = contentWidthMm;
const BOTTOM = T.page.contentBottomMm;

export interface RenderV2Options {
  maxPages?: number;
  assets?: KundliRenderAssets;
  /** Print a light background tint. Disable for pure line-art proofs. */
  paperTint?: boolean;
}

export interface RenderV2Result {
  buffer: Uint8Array;
  metrics: PdfRenderMetrics;
  pageTitles: string[];
}

function b64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 32768) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 32768)));
  }
  return btoa(bin);
}

const hasDev = (s: string) => /[\u0900-\u097F]/.test(s);

export async function renderKundliPdfV2(
  report: KundliReportModelV2,
  options: RenderV2Options = {},
): Promise<RenderV2Result> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const assets: KundliRenderAssets = { ...loadKundliRenderAssets(), ...(options.assets ?? {}) };
  const paperTint = options.paperTint ?? true;
  const maxPages = options.maxPages ?? 40;

  /* ---------------- fonts ---------------- */
  let devRegular = false;
  let devBold = false;
  if (assets.devanagariRegularBase64) {
    try {
      doc.addFileToVFS('NotoSansDevanagari-Regular.ttf', assets.devanagariRegularBase64);
      doc.addFont('NotoSansDevanagari-Regular.ttf', 'devanagari', 'normal');
      doc.addFont('NotoSansDevanagari-Regular.ttf', 'devanagari', 'bold');
      devRegular = true;
    } catch { devRegular = false; }
  }
  if (!devRegular) {
    try {
      const res = await fetch('/fonts/NotoSansDevanagari-Regular.ttf');
      if (res.ok) {
        doc.addFileToVFS('NotoSansDevanagari-Regular.ttf', b64(await res.arrayBuffer()));
        doc.addFont('NotoSansDevanagari-Regular.ttf', 'devanagari', 'normal');
        doc.addFont('NotoSansDevanagari-Regular.ttf', 'devanagari', 'bold');
        devRegular = true;
      }
    } catch { devRegular = false; }
  }
  // V1 registered the regular face under the "bold" style too, so Devanagari
  // headings were never actually bold. V40 loads the real bold face when it is
  // available and falls back honestly when it is not.
  if (devRegular) {
    try {
      const proc = (globalThis as { process?: { getBuiltinModule?: (m: string) => unknown } }).process;
      if (typeof window === 'undefined' && proc?.getBuiltinModule) {
        const fs = proc.getBuiltinModule('node:fs') as typeof import('node:fs');
        const path = proc.getBuiltinModule('node:path') as typeof import('node:path');
        const p = path.join(process.cwd(), 'public', 'fonts', 'NotoSansDevanagari-Bold.ttf');
        if (fs.existsSync(p)) {
          doc.addFileToVFS('NotoSansDevanagari-Bold.ttf', fs.readFileSync(p).toString('base64'));
          doc.addFont('NotoSansDevanagari-Bold.ttf', 'devanagari-bold', 'normal');
          devBold = true;
        }
      }
    } catch { devBold = false; }
  }

  const setFont = (text: string, bold: boolean) => {
    if (hasDev(text) && devRegular) {
      if (bold && devBold) doc.setFont('devanagari-bold', 'normal');
      else doc.setFont('devanagari', bold ? 'bold' : 'normal');
    } else {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
    }
  };
  const ink = (c: readonly [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
  const fill = (c: readonly [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c: readonly [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2]);

  /* ---------------- page chrome ---------------- */
  const pageTitles: string[] = [];
  let runningTitle = '';

  const paintPaper = () => {
    if (!paperTint) return;
    fill(T.colors.parchment);
    doc.rect(0, 0, PW, PH, 'F');
  };

  const createPage = () => {
    doc.addPage();
    paintPaper();
    pageTitles.push(runningTitle);
  };

  const controller = new PaginationController({
    maxPages,
    pageHeightMm: PH,
    pageWidthMm: PW,
    marginMm: MT,
    contentBottomMm: BOTTOM,
  });

  /* ---------------- primitive text ---------------- */

  /** Wrap + draw text; returns consumed height. Never paginates by itself. */
  /* ----------------------------------------------------------------
   * Mixed-script text engine.
   *
   * Two hard constraints discovered by probing jsPDF's output, both of which
   * silently corrupt a page rather than failing loudly:
   *
   *  1. The embedded Devanagari face renders Devanagari and digits, but a
   *     Latin LETTER in the same run truncates the rest of the string. So a
   *     bilingual line must be drawn as separate runs in separate fonts.
   *  2. A standard (Helvetica) run containing any character outside WinAnsi
   *     — an arrow, a prime, a tick — flips jsPDF into a UTF-16 path that
   *     prints garbage. So Latin runs are sanitised to WinAnsi first.
   *
   * Everything below exists to make those two failures impossible rather
   * than to be caught later by a reviewer's eye.
   * ---------------------------------------------------------------- */

  const CHAR_FALLBACK: Record<string, string> = {
    '\u2192': '>', '\u2190': '<', '\u21D2': '=>',
    '\u2032': "'", '\u2033': '"',
    '\u2018': "'", '\u2019': "'", '\u201C': '"', '\u201D': '"',
    '\u2265': '>=', '\u2264': '<=', '\u2260': '!=', '\u00D7': 'x',
    '\u2713': '+', '\u2717': 'x', '\u25C7': 'o', '\u25CB': 'o', '\u25CF': 'o',
    '\u2026': '...', '\u00A0': ' ', '\u2011': '-', '\u2212': '-', '\u2044': '/',
  };
  /** WinAnsi codepoints above 0x7E that jsPDF's standard fonts handle. */
  const WINANSI_EXTRA = new Set(['\u2013', '\u2014', '\u2022', '\u2020', '\u2021', '\u2030', '\u20AC', '\u2122']);

  const sanitizeLatin = (s: string): string => {
    let out = '';
    for (const ch of s) {
      const cp = ch.codePointAt(0) ?? 0;
      if (cp <= 0x7e) { out += ch; continue; }
      if (CHAR_FALLBACK[ch]) { out += CHAR_FALLBACK[ch]; continue; }
      if (WINANSI_EXTRA.has(ch)) { out += ch; continue; }
      if (cp <= 0xff) { out += ch; continue; }
      out += '-';
    }
    return out;
  };

  const sanitizeDev = (s: string): string => {
    let out = '';
    for (const ch of s) {
      const cp = ch.codePointAt(0) ?? 0;
      if (cp >= 0x0900 && cp <= 0x097f) { out += ch; continue; }
      if (CHAR_FALLBACK[ch]) { out += CHAR_FALLBACK[ch]; continue; }
      if (cp <= 0x7e) { out += ch; continue; }
      if (ch === '\u2013' || ch === '\u2014') { out += ch; continue; }
      out += '-';
    }
    return out;
  };

  interface Atom { t: string; dev: boolean; space: boolean; w: number }
  interface Line { atoms: Atom[]; width: number }

  const ATOMISER = /[\u0900-\u097F][\u0900-\u097F\u200C\u200D]*|\s+|[^\s\u0900-\u097F]+/g;

  const atomWidth = (t: string, dev: boolean, size: number, bold: boolean): number => {
    if (dev && devRegular) doc.setFont(bold && devBold ? 'devanagari-bold' : 'devanagari', bold && devBold ? 'normal' : (bold ? 'bold' : 'normal'));
    else doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    return doc.getTextWidth(t);
  };

  /** Breaks text into laid-out lines, honouring script runs and the width. */
  const layout = (text: string, maxWidth: number, size: number, bold: boolean): Line[] => {
    const raw = text.match(ATOMISER) ?? [];
    const atoms: Atom[] = [];
    for (const piece of raw) {
      const space = /^\s+$/.test(piece);
      const dev = /[\u0900-\u097F]/.test(piece);
      const t = space ? ' ' : (dev ? sanitizeDev(piece) : sanitizeLatin(piece));
      if (t.length === 0) continue;
      atoms.push({ t, dev, space, w: atomWidth(t, dev, size, bold) });
    }

    const lines: Line[] = [];
    let cur: Atom[] = [];
    let curW = 0;
    const flush = () => {
      while (cur.length > 0 && cur[cur.length - 1].space) { curW -= cur[cur.length - 1].w; cur.pop(); }
      if (cur.length > 0) lines.push({ atoms: cur, width: curW });
      cur = []; curW = 0;
    };

    for (const atom of atoms) {
      if (atom.space && cur.length === 0) continue;
      if (!atom.space && atom.w > maxWidth && cur.length === 0) {
        // A single token wider than the column: break it character by
        // character rather than letting it bleed past the margin.
        let buf = '';
        let bufW = 0;
        for (const ch of atom.t) {
          const cw = atomWidth(ch, atom.dev, size, bold);
          if (bufW + cw > maxWidth && buf.length > 0) {
            lines.push({ atoms: [{ t: buf, dev: atom.dev, space: false, w: bufW }], width: bufW });
            buf = ''; bufW = 0;
          }
          buf += ch; bufW += cw;
        }
        if (buf.length > 0) { cur = [{ t: buf, dev: atom.dev, space: false, w: bufW }]; curW = bufW; }
        continue;
      }
      if (!atom.space && curW + atom.w > maxWidth && cur.length > 0) flush();
      cur.push(atom);
      curW += atom.w;
    }
    flush();

    // Adjacent atoms in the same script are merged back into one run before
    // drawing. Two reasons: kerning stays natural, and a PDF text extractor
    // sees real words with real spaces instead of a string of separate
    // glyph placements — which is what makes the document searchable.
    const merged = lines.map((line) => {
      const groups: Atom[] = [];
      for (const atom of line.atoms) {
        const prev = groups[groups.length - 1];
        const dev = atom.space ? (prev ? prev.dev : atom.dev) : atom.dev;
        if (prev && prev.dev === dev) prev.t += atom.t;
        else groups.push({ t: atom.t, dev, space: false, w: 0 });
      }
      let width = 0;
      for (const g of groups) { g.w = atomWidth(g.t, g.dev, size, bold); width += g.w; }
      return { atoms: groups, width };
    });
    return merged.length > 0 ? merged : [{ atoms: [], width: 0 }];
  };

  const drawLines = (
    lines: Line[],
    x: number,
    y: number,
    width: number,
    opts: { size: number; bold?: boolean; color?: readonly [number, number, number]; align?: 'left' | 'right' | 'center'; lineMm: number },
  ): void => {
    const bold = opts.bold ?? false;
    ink(opts.color ?? T.colors.ink);
    lines.forEach((line, i) => {
      let cx = x;
      if (opts.align === 'right') cx = x + width - line.width;
      else if (opts.align === 'center') cx = x + (width - line.width) / 2;
      const baseline = y + opts.size * 0.35 + i * opts.lineMm;
      for (const atom of line.atoms) {
        if (atom.space) { cx += atom.w; continue; }
        if (atom.dev && devRegular) {
          if (bold && devBold) doc.setFont('devanagari-bold', 'normal');
          else doc.setFont('devanagari', bold ? 'bold' : 'normal');
        } else {
          doc.setFont('helvetica', bold ? 'bold' : 'normal');
        }
        doc.setFontSize(opts.size);
        ink(opts.color ?? T.colors.ink);
        doc.text(atom.t, cx, baseline);
        cx += atom.w;
      }
    });
  };

  const defaultLineMm = (size: number) =>
    size <= T.typography.sizes.small ? T.spacing.tightLineMm : T.spacing.lineMm;

  const drawText = (
    text: string,
    x: number,
    y: number,
    width: number,
    opts: { size: number; bold?: boolean; color?: readonly [number, number, number]; align?: 'left' | 'right' | 'center'; lineMm?: number },
  ): number => {
    const lineMm = opts.lineMm ?? defaultLineMm(opts.size);
    const lines = layout(text, width, opts.size, opts.bold ?? false);
    drawLines(lines, x, y, width, { ...opts, lineMm });
    controller.recordChars(text.length);
    return lines.length * lineMm;
  };

  const measureText = (text: string, width: number, size: number, bold = false, lineMm?: number): number =>
    layout(text, width, size, bold).length * (lineMm ?? defaultLineMm(size));

  /* ---------------- decorative marks ---------------- */

  const drawMotif = (cx: number, y: number, w: number) => {
    stroke(T.colors.gold);
    doc.setLineWidth(T.rule.hairlineMm);
    doc.line(cx - w / 2, y, cx - 6, y);
    doc.line(cx + 6, y, cx + w / 2, y);
    // A small four-petal lozenge, drawn from lines so it stays crisp in print.
    const r = 2.4;
    doc.line(cx - r, y, cx, y - r);
    doc.line(cx, y - r, cx + r, y);
    doc.line(cx + r, y, cx, y + r);
    doc.line(cx, y + r, cx - r, y);
  };

  const drawCornerMarks = (inset: number) => {
    stroke(T.colors.goldFaint);
    doc.setLineWidth(T.rule.hairlineMm);
    const m = T.sacredAccent.cornerMarkMm;
    const pts: [number, number, number, number][] = [
      [inset, inset, inset + m, inset], [inset, inset, inset, inset + m],
      [PW - inset, inset, PW - inset - m, inset], [PW - inset, inset, PW - inset, inset + m],
      [inset, PH - inset, inset + m, PH - inset], [inset, PH - inset, inset, PH - inset - m],
      [PW - inset, PH - inset, PW - inset - m, PH - inset], [PW - inset, PH - inset, PW - inset, PH - inset - m],
    ];
    for (const [x1, y1, x2, y2] of pts) doc.line(x1, y1, x2, y2);
  };

  /* ---------------- block renderers ---------------- */

  const renderCover = (b: CoverBlock): number => {
    // The cover owns the whole first page; it manages its own vertical space.
    fill(T.colors.parchmentDeep);
    doc.rect(0, 0, PW, PH, 'F');
    stroke(T.colors.gold);
    doc.setLineWidth(T.rule.lightMm);
    doc.rect(10, 10, PW - 20, PH - 20);
    stroke(T.colors.goldFaint);
    doc.setLineWidth(T.rule.hairlineMm);
    doc.rect(12.5, 12.5, PW - 25, PH - 25);
    drawCornerMarks(16);

    let y = 30;
    if (assets.ganesh256Base64) {
      try { doc.addImage(assets.ganesh256Base64, 'PNG', ML + 4, y, 30, 30); } catch { /* optional */ }
    }
    if (assets.cosmictantraSymbolBase64) {
      try { doc.addImage(assets.cosmictantraSymbolBase64, 'PNG', PW - MR - 34, y, 30, 30); } catch { /* optional */ }
    }
    const invocation = devRegular ? b.invocation : 'Shri Ganeshaya Namah';
    drawText(invocation, ML, y + 11, CW, { size: 13, bold: true, color: T.colors.vermilion, align: 'center' });
    y += 38;

    drawMotif(PW / 2, y, T.sacredAccent.motifWidthMm);
    y += 10;

    drawText(b.brand.toUpperCase().split('').join(' '), ML, y, CW, {
      size: 10, bold: true, color: T.colors.gold, align: 'center',
    });
    y += 9;
    y += drawText(b.documentTitle, ML, y, CW, {
      size: devRegular ? T.typography.sizes.coverTitle : 18, bold: true, color: T.colors.vermilion, align: 'center', lineMm: 11,
    });
    y += 1;
    drawText('MASTER KUNDLI  ·  PANDIT WORKBENCH EDITION', ML, y, CW, {
      size: 8.6, bold: true, color: T.colors.inkSoft, align: 'center',
    });
    y += 12;

    stroke(T.colors.rule); doc.setLineWidth(T.rule.hairlineMm);
    doc.line(ML + 30, y, PW - MR - 30, y);
    y += 9;

    y += drawText(b.subjectName, ML, y, CW, {
      size: T.typography.sizes.coverName, bold: true, color: T.colors.ink, align: 'center', lineMm: 9,
    });
    y += 2;
    for (const line of b.birthLines) {
      y += drawText(line, ML, y, CW, { size: T.typography.sizes.coverMeta, color: T.colors.inkSoft, align: 'center', lineMm: 5.4 });
    }
    y += 8;

    // Identity panel — the three facts a Pandit checks first.
    const panelH = b.identityLines.length * 6.4 + 8;
    fill(T.colors.parchment);
    doc.rect(ML + 14, y, CW - 28, panelH, 'F');
    stroke(T.colors.goldFaint); doc.setLineWidth(T.rule.hairlineMm);
    doc.rect(ML + 14, y, CW - 28, panelH);
    let py = y + 5;
    for (const line of b.identityLines) {
      py += drawText(line, ML + 18, py, CW - 36, { size: 10.5, color: T.colors.ink, align: 'center', lineMm: 6.4 });
    }
    y += panelH + 8;

    drawText(b.currentPeriodLine, ML, y, CW, { size: 9.5, bold: true, color: T.colors.vermilionSoft, align: 'center' });
    y += 12;
    drawMotif(PW / 2, y, 40);

    // Verification band, bottom of the cover.
    let vy = PH - 52;
    stroke(T.colors.rule); doc.setLineWidth(T.rule.hairlineMm);
    doc.line(ML + 20, vy, PW - MR - 20, vy);
    vy += 6;
    vy += drawText(`Report ID  ${b.reportId}`, ML, vy, CW, { size: 9, bold: true, color: T.colors.ink, align: 'center', lineMm: 5 });
    for (const line of b.verificationBadge) {
      vy += drawText(line, ML, vy, CW, { size: T.typography.sizes.micro, color: T.colors.inkFaint, align: 'center', lineMm: 4 });
    }
    vy += 2;
    drawText(
      'This document states what was calculated, what a tradition says about it, and what was not calculated at all.',
      ML + 10, vy, CW - 20, { size: T.typography.sizes.micro, color: T.colors.inkFaint, align: 'center', lineMm: 4 },
    );

    controller.advance(BOTTOM - MT - 1);
    return BOTTOM - MT - 1;
  };

  const renderPartDivider = (b: PartDividerBlock): number => {
    fill(T.colors.parchmentDeep);
    doc.rect(0, 0, PW, PH, 'F');
    drawCornerMarks(16);
    let y = 78;
    drawMotif(PW / 2, y, T.sacredAccent.motifWidthMm);
    y += 14;
    y += drawText(b.title, ML, y, CW, { size: 19, bold: true, color: T.colors.vermilion, align: 'center', lineMm: 10 });
    y += 2;
    y += drawText(b.subtitle, ML, y, CW, { size: 12, color: T.colors.inkSoft, align: 'center', lineMm: 7 });
    y += 12;
    stroke(T.colors.rule); doc.setLineWidth(T.rule.hairlineMm);
    doc.line(ML + 40, y, PW - MR - 40, y);
    y += 10;
    for (const c of b.contents) {
      y += drawText(c, ML + 40, y, CW - 80, { size: 9.4, color: T.colors.ink, lineMm: 6.2 });
    }
    y += 10;
    drawMotif(PW / 2, y, 40);
    controller.advance(BOTTOM - MT - 1);
    return BOTTOM - MT - 1;
  };

  const renderSectionTitle = (b: SectionTitleBlock): number => {
    const h = (b.secondary ? 15 : 11);
    controller.ensureFits(h + T.heading.minLinesAfterHeadingMm, createPage);
    const y = controller.cursorY;
    drawText(b.text, ML, y, CW * 0.75, { size: T.typography.sizes.sectionTitle, bold: true, color: T.colors.vermilion, lineMm: 7 });
    if (b.tag) {
      drawText(b.tag, ML + CW * 0.7, y + 1.5, CW * 0.3, { size: T.typography.sizes.micro, color: T.colors.inkFaint, align: 'right' });
    }
    if (b.secondary) {
      drawText(b.secondary, ML, y + 6.5, CW * 0.75, { size: 10, color: T.colors.inkSoft, lineMm: 5 });
    }
    stroke(T.colors.gold);
    doc.setLineWidth(T.heading.sectionRuleWidthMm);
    doc.line(ML, y + h - 3, PW - MR, y + h - 3);
    controller.advance(h);
    return h;
  };

  const renderHeading = (level: 2 | 3, text: string): number => {
    const size = level === 2 ? T.typography.sizes.h2 : T.typography.sizes.h3;
    const h = measureText(text, CW, size, true, level === 2 ? 6 : 5.2) + T.spacing.headingGapMm;
    controller.ensureFits(h + T.heading.minLinesAfterHeadingMm, createPage);
    drawText(text, ML, controller.cursorY + 1.5, CW, {
      size, bold: true, color: level === 2 ? T.colors.ink : T.colors.vermilionSoft, lineMm: level === 2 ? 6 : 5.2,
    });
    controller.advance(h);
    return h;
  };

  const renderParagraph = (text: string, size: 'body' | 'small' | 'micro'): number => {
    const pt = size === 'body' ? T.typography.sizes.body : size === 'small' ? T.typography.sizes.small : T.typography.sizes.micro;
    const lineMm = size === 'body' ? T.spacing.lineMm : size === 'small' ? T.spacing.tightLineMm : 3.4;
    const color = size === 'micro' ? T.colors.inkFaint : size === 'small' ? T.colors.inkSoft : T.colors.ink;
    // A long paragraph may legitimately outrun a page; it is placed line group
    // by line group so the break lands between lines, never through one.
    const lines = layout(text, CW, pt, false);
    let consumed = 0;
    let i = 0;
    while (i < lines.length) {
      const remaining = Math.max(0, BOTTOM - controller.cursorY);
      let fitCount = Math.floor(remaining / lineMm);
      if (fitCount < 1) { controller.newPage(createPage); continue; }
      fitCount = Math.min(fitCount, lines.length - i);
      const chunk = lines.slice(i, i + fitCount);
      drawLines(chunk, ML, controller.cursorY, CW, { size: pt, color, lineMm });
      controller.recordChars(chunk.reduce((n, l) => n + l.atoms.reduce((m, a2) => m + a2.t.length, 0), 0));
      const h = chunk.length * lineMm;
      controller.advance(h);
      consumed += h;
      i += fitCount;
    }
    controller.advance(T.spacing.blockGapMm);
    return consumed + T.spacing.blockGapMm;
  };

  const renderBullets = (items: string[], size: 'body' | 'small'): number => {
    const pt = size === 'body' ? T.typography.sizes.body : T.typography.sizes.small;
    const lineMm = size === 'body' ? T.spacing.lineMm : T.spacing.tightLineMm;
    let consumed = 0;
    for (const item of items) {
      const h = measureText(item, CW - 5, pt, false, lineMm) + 1;
      controller.ensureFits(Math.min(h, controller.usableHeight - 1), createPage);
      stroke(T.colors.gold);
      fill(T.colors.gold);
      doc.circle(ML + 1.4, controller.cursorY + 1.5, 0.5, 'F');
      drawText(item, ML + 5, controller.cursorY, CW - 5, { size: pt, color: T.colors.ink, lineMm });
      controller.advance(h);
      consumed += h;
    }
    controller.advance(T.spacing.blockGapMm);
    return consumed + T.spacing.blockGapMm;
  };

  const renderKvGrid = (b: KvGridBlock): number => {
    let consumed = 0;
    if (b.title) consumed += renderHeading(3, b.title);
    const cols = b.columns;
    const colW = (CW - (cols - 1) * 6) / cols;
    const labelW = colW * 0.4;
    const valueW = colW - labelW - 2;

    const cellHeights = b.items.map((it) => Math.max(
      measureText(it.label, labelW, T.typography.sizes.small, true, T.spacing.tightLineMm),
      measureText(it.value, valueW, T.typography.sizes.small, false, T.spacing.tightLineMm)
        + (it.note ? measureText(it.note, valueW, T.typography.sizes.micro, false, 3.4) : 0),
    ) + 1.6);

    for (let i = 0; i < b.items.length; i += cols) {
      const rowItems = b.items.slice(i, i + cols);
      const rowH = Math.max(...cellHeights.slice(i, i + cols));
      controller.ensureFits(Math.min(rowH, controller.usableHeight - 1), createPage);
      const y = controller.cursorY;
      rowItems.forEach((it, c) => {
        const x = ML + c * (colW + 6);
        drawText(it.label, x, y, labelW, { size: T.typography.sizes.small, bold: true, color: T.colors.inkSoft, lineMm: T.spacing.tightLineMm });
        const vh = drawText(it.value, x + labelW, y, valueW, { size: T.typography.sizes.small, color: T.colors.ink, lineMm: T.spacing.tightLineMm });
        if (it.note) {
          drawText(it.note, x + labelW, y + vh, valueW, { size: T.typography.sizes.micro, color: T.colors.inkFaint, lineMm: 3.4 });
        }
      });
      stroke(T.colors.ruleFaint);
      doc.setLineWidth(T.rule.hairlineMm);
      doc.line(ML, y + rowH - 0.8, PW - MR, y + rowH - 0.8);
      controller.advance(rowH);
      consumed += rowH;
    }
    controller.advance(T.spacing.blockGapMm);
    return consumed + T.spacing.blockGapMm;
  };

  const renderTable = (b: TableBlockV2): number => {
    const n = b.headers.length;
    const widths = (b.widths && b.widths.length === n)
      ? b.widths.map((w) => w * CW)
      : new Array(n).fill(CW / n);
    const align = b.align ?? new Array(n).fill('left');
    const pad = T.spacing.tableCellPadMm;
    const size = T.typography.sizes.table;

    const rowHeight = (cells: string[], bold: boolean): number => {
      let max: number = T.spacing.tableRowMinMm;
      cells.forEach((cell, i) => {
        const h = measureText(cell, widths[i] - 2 * pad, size, bold, T.spacing.tightLineMm) + 2 * pad * 0.7;
        if (h > max) max = h;
      });
      return max;
    };

    const headerH = rowHeight(b.headers, true);
    let consumed = 0;

    const drawRow = (cells: string[], h: number, bold: boolean, bg?: readonly [number, number, number]) => {
      const y = controller.cursorY;
      if (bg) { fill(bg); doc.rect(ML, y, CW, h, 'F'); }
      let x = ML;
      cells.forEach((cell, i) => {
        drawText(cell, x + pad, y + pad * 0.6, widths[i] - 2 * pad, {
          size, bold, color: bold ? T.colors.ink : T.colors.ink,
          align: align[i], lineMm: T.spacing.tightLineMm,
        });
        x += widths[i];
      });
      stroke(T.colors.ruleFaint);
      doc.setLineWidth(T.rule.hairlineMm);
      doc.line(ML, y + h, PW - MR, y + h);
      controller.advance(h);
      consumed += h;
    };

    controller.ensureFits(Math.min(headerH + T.spacing.tableRowMinMm * 2, controller.usableHeight - 1), createPage);
    drawRow(b.headers, headerH, true, T.colors.tableHeaderFill);

    const highlight = new Set(b.highlightRows ?? []);
    b.rows.forEach((row, i) => {
      const h = rowHeight(row, false);
      if (controller.cursorY + h > BOTTOM) {
        controller.newPage(createPage);
        if (T.table.headerRepeat) drawRow(b.headers, headerH, true, T.colors.tableHeaderFill);
      }
      const bg = highlight.has(i)
        ? T.colors.highlightFill
        : (T.table.zebra && i % 2 === 1 ? T.colors.tableZebra : undefined);
      drawRow(row, h, false, bg);
    });

    if (b.caption) consumed += renderParagraph(b.caption, 'micro');
    if (b.footnote) consumed += renderParagraph(b.footnote, 'micro');
    controller.advance(T.spacing.blockGapMm);
    return consumed + T.spacing.blockGapMm;
  };

  /**
   * Status marks are DRAWN, not typed. A tick or a diamond from a text font
   * is at the mercy of the font's coverage; a drawn mark always prints, and
   * it survives a black-and-white photocopy, which is the point of using a
   * shape rather than a colour.
   */
  const drawStatusMark = (
    status: string,
    x: number,
    y: number,
    size = 2.6,
  ): void => {
    const cx = x + size / 2;
    const cy = y + size / 2 + 0.6;
    const r = size / 2;
    doc.setLineWidth(0.35);
    switch (status) {
      case 'PRESENT':
        stroke(T.colors.vermilion);
        doc.line(cx - r, cy, cx - r * 0.25, cy + r * 0.8);
        doc.line(cx - r * 0.25, cy + r * 0.8, cx + r, cy - r);
        break;
      case 'ABSENT':
        stroke(T.colors.inkSoft);
        doc.line(cx - r * 0.8, cy - r * 0.8, cx + r * 0.8, cy + r * 0.8);
        doc.line(cx + r * 0.8, cy - r * 0.8, cx - r * 0.8, cy + r * 0.8);
        break;
      case 'SCHOLAR_JUDGEMENT':
      case 'INDETERMINATE':
        stroke(T.colors.gold);
        doc.line(cx, cy - r, cx + r, cy);
        doc.line(cx + r, cy, cx, cy + r);
        doc.line(cx, cy + r, cx - r, cy);
        doc.line(cx - r, cy, cx, cy - r);
        break;
      case 'VALIDATION_PENDING':
        stroke(T.colors.gold);
        doc.circle(cx, cy, r * 0.85, 'S');
        break;
      default: // NOT_CALCULATED
        stroke(T.colors.inkFaint);
        doc.line(cx - r, cy, cx + r, cy);
        break;
    }
  };

  const renderStatusList = (b: StatusListBlock): number => {
    let consumed = 0;
    if (b.title) consumed += renderHeading(3, b.title);
    const glyphW = 6;
    const xrefW = 34;
    const labelW = 52;
    const noteW = CW - glyphW - xrefW - labelW - 4;

    for (const it of b.items) {
      const statusWord = it.status.replace(/_/g, ' ').toLowerCase();
      const noteText = it.note ? `${statusWord} — ${it.note}` : statusWord;
      // The row must be measured with the string that is actually drawn,
      // otherwise a two-line note silently overlaps the next row.
      const h = Math.max(
        measureText(it.label, labelW, T.typography.sizes.small, true, T.spacing.tightLineMm),
        measureText(noteText, noteW, T.typography.sizes.small, false, T.spacing.tightLineMm),
        T.spacing.tightLineMm,
      ) + 1.4;
      controller.ensureFits(Math.min(h, controller.usableHeight - 1), createPage);
      const y = controller.cursorY;
      drawStatusMark(it.status, ML, y);
      drawText(it.label, ML + glyphW, y, labelW, { size: T.typography.sizes.small, bold: true, color: T.colors.ink, lineMm: T.spacing.tightLineMm });
      drawText(noteText, ML + glyphW + labelW + 2, y, noteW, { size: T.typography.sizes.small, color: T.colors.inkSoft, lineMm: T.spacing.tightLineMm });
      if (it.xref) {
        drawText(it.xref, PW - MR - xrefW, y, xrefW, { size: T.typography.sizes.micro, color: T.colors.inkFaint, align: 'right' });
      }
      controller.advance(h);
      consumed += h;
    }
    controller.advance(T.spacing.blockGapMm);
    return consumed + T.spacing.blockGapMm;
  };

  const renderTimeline = (b: TimelineBlock): number => {
    const labelW = 26;
    const dateW = 44;
    const barX = ML + labelW + dateW;
    const barMax = CW - labelW - dateW - 12;
    const maxYears = Math.max(1, ...b.periods.map((p) => p.years));
    let consumed = 0;

    for (const period of b.periods) {
      const h = 6.4;
      controller.ensureFits(h, createPage);
      const y = controller.cursorY;
      if (period.current) {
        fill(T.colors.highlightFill);
        doc.rect(ML - 1, y - 0.6, CW + 2, h, 'F');
      }
      drawText(period.label, ML, y, labelW, {
        size: T.typography.sizes.small, bold: period.current, color: T.colors.ink, lineMm: T.spacing.tightLineMm,
      });
      drawText(`${period.start} to ${period.end}`, ML + labelW, y, dateW, {
        size: T.typography.sizes.micro, color: T.colors.inkSoft, lineMm: 3.4,
      });
      const w = Math.max(1.5, (period.years / maxYears) * barMax);
      fill(period.current ? T.colors.vermilion : T.colors.goldFaint);
      doc.rect(barX, y + 0.7, w, 2.6, 'F');
      drawText(`${period.years.toFixed(0)}y`, barX + w + 1.5, y, 12, {
        size: T.typography.sizes.micro, color: T.colors.inkFaint, lineMm: 3.4,
      });
      controller.advance(h);
      consumed += h;
    }
    consumed += renderParagraph(b.caption, 'micro');
    return consumed;
  };

  const renderNotesArea = (b: NotesAreaBlock): number => {
    const lineGap = 7.2;
    const h = 6 + b.lines * lineGap;
    controller.ensureFits(Math.min(h, controller.usableHeight - 1), createPage);
    const y = controller.cursorY;
    drawText(b.title, ML, y, CW, { size: T.typography.sizes.small, bold: true, color: T.colors.vermilionSoft });
    stroke(T.colors.notesRule);
    doc.setLineWidth(T.rule.hairlineMm);
    for (let i = 0; i < b.lines; i += 1) {
      const ly = y + 6 + i * lineGap + 3;
      doc.line(ML, ly, PW - MR, ly);
    }
    controller.advance(h);
    return h;
  };

  const renderCallout = (b: CalloutBlockV2): number => {
    const inner = CW - 10;
    const titleH = b.title ? measureText(b.title, inner, T.typography.sizes.small, true, T.spacing.tightLineMm) + 1 : 0;
    const textH = measureText(b.text, inner, T.typography.sizes.small, false, T.spacing.tightLineMm);
    const h = titleH + textH + 6;
    controller.ensureFits(Math.min(h, controller.usableHeight - 1), createPage);
    const y = controller.cursorY;
    fill(b.tone === 'info' ? T.colors.calloutInfo : T.colors.calloutWarn);
    doc.rect(ML, y, CW, h, 'F');
    stroke(b.tone === 'info' ? T.colors.rule : T.colors.vermilionSoft);
    doc.setLineWidth(T.rule.lightMm);
    doc.line(ML, y, ML, y + h);
    let ty = y + 3;
    if (b.title) {
      ty += drawText(b.title, ML + 5, ty, inner, { size: T.typography.sizes.small, bold: true, color: T.colors.vermilion, lineMm: T.spacing.tightLineMm }) + 1;
    }
    drawText(b.text, ML + 5, ty, inner, { size: T.typography.sizes.small, color: T.colors.ink, lineMm: T.spacing.tightLineMm });
    controller.advance(h);
    controller.advance(T.spacing.blockGapMm);
    return h + T.spacing.blockGapMm;
  };

  const renderChart = (b: ChartBlockV2): number => {
    const model = b.data as ChartRenderModel | undefined;
    if (!model || !Array.isArray(model.houses) || model.houses.length !== 12) {
      // An incomplete model must never be drawn: a wrong chart is
      // indistinguishable from a right one.
      return renderCallout({
        kind: 'callout', tone: 'warning',
        title: 'Chart not drawn',
        text: 'The chart render model was incomplete, so no diagram was drawn. This is reported rather than approximated.',
      });
    }
    const side = b.size === 'hero' ? T.chart.heroSizeMm : T.chart.inlineSizeMm;
    const factsH = b.sideFacts && b.sideFacts.length > 0 ? 6 : 0;
    const capH = measureText(b.caption, CW, T.chart.captionSize, false, 3.6);
    const h = side + 6 + factsH + capH + 2;
    controller.ensureFits(Math.min(h, controller.usableHeight - 1), createPage);
    const left = ML + (CW - side) / 2;
    const top = controller.cursorY + 3;

    drawChartToPdf(doc as unknown as PdfChartSurface, model, left, top, {
      size: side,
      baseFontSize: T.chart.baseFontSize,
      minFontSize: T.chart.minFontSize,
      devFontAvailable: devRegular,
    });

    let y = top + side + 3;
    if (b.sideFacts && b.sideFacts.length > 0) {
      const text = b.sideFacts.map((f) => `${f.label}: ${f.value}`).join('     ·     ');
      drawText(text, ML, y, CW, { size: T.typography.sizes.small, bold: true, color: T.colors.ink, align: 'center', lineMm: 5 });
      y += factsH;
    }
    drawText(b.caption, ML, y, CW, { size: T.chart.captionSize, color: T.colors.inkFaint, lineMm: 3.6 });
    controller.advance(h);
    return h;
  };

  const renderDivider = (): number => {
    const h = 4;
    controller.ensureFits(h, createPage);
    stroke(T.colors.ruleFaint);
    doc.setLineWidth(T.rule.hairlineMm);
    doc.line(ML, controller.cursorY + 1.5, PW - MR, controller.cursorY + 1.5);
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

  /* ---------------- document walk ---------------- */

  try {
    paintPaper();
    pageTitles.push('Cover');

    report.sections.forEach((section: V2Section, index: number) => {
      if (section.status !== 'READY') return;
      if (section.blocks.length === 0) {
        throw new KundliError('KUNDLI_REPORT_INCOMPLETE', `section ${section.id} has no blocks`, { sectionId: section.id });
      }
      runningTitle = section.title;
      if (section.startsNewPage && index > 0) {
        controller.newPage(createPage);
      }
      pageTitles[controller.pageCount - 1] = section.title;
      for (const block of section.blocks) renderBlock(block);
      controller.advance(T.spacing.sectionGapMm);
    });
  } catch (e) {
    if (e instanceof KundliError) throw e;
    throw new KundliError('KUNDLI_PDF_RENDER_FAILED', 'V40 PDF rendering failed unexpectedly', { cause: String(e) });
  }

  /* ---------------- chrome pass ----------------
   * Header and footer are drawn last, when the total page count is known, so
   * "page 4 of 21" can be honest rather than guessed.
   */
  const total = controller.pageCount;
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    if (page === 1) continue; // the cover carries no running chrome
    const isDivider = pageTitles[page - 1] === 'Scholar Appendix' && page > 1;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(T.typography.sizes.footer);
    ink(T.colors.inkFaint);
    if (!isDivider) {
      const t = (pageTitles[page - 1] ?? '').toUpperCase();
      doc.text(t, ML, T.page.headerBaselineMm);
      doc.text(report.subject.name, PW - MR, T.page.headerBaselineMm, { align: 'right' });
      stroke(T.colors.ruleFaint);
      doc.setLineWidth(T.rule.hairlineMm);
      doc.line(ML, T.page.headerBaselineMm + 2, PW - MR, T.page.headerBaselineMm + 2);
    }
    doc.setFontSize(T.typography.sizes.footer);
    ink(T.colors.inkFaint);
    doc.text(`CosmicTantra  ·  ${report.reportId}`, ML, T.page.footerBaselineMm);
    doc.text(`page ${page} of ${total}`, PW - MR, T.page.footerBaselineMm, { align: 'right' });
  }

  const metrics: PdfRenderMetrics = {
    pageCount: controller.pageCount,
    placedCharsByPage: controller.charsByPage,
    blocksRendered: controller.blockCount,
    sectionsRendered: report.sections.filter((s) => s.status === 'READY').length,
  };

  const out = doc.output('arraybuffer');
  return { buffer: new Uint8Array(out), metrics, pageTitles };
}
