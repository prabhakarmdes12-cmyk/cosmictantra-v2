/**
 * KUNDLI V42 — Milan PDF renderer.
 *
 * Uses the same pdfkit/fontkit drawing stack as the Master Kundli renderer v3
 * (so Devanagari shaping comes from the font, not from hand reordering). This
 * is the v42 *first* renderer: it draws a focused Milan report (cover, score,
 * koota table, doshas, explanatory prediction layer, sources) rather than the
 * full 17-volume book. The renderer derives nothing — it only draws the
 * `MilanCalculation` returned by `calculateMilan`.
 */
import { PdfSurfaceV3, ptToMm, type Rgb } from '../../v40/pdf/surface';
import { FontStack, type RunStyle } from '../../v40/pdf/fontStack';
import { V3, BASELINE_EM } from '../../v40/tokensV3';
import type { MilanCalculation, KootaResult, PredictionBlock } from './milanEngine';

const PW = V3.page.widthMm;
const PH = V3.page.heightMm;
const ML = V3.page.marginLeftMm;
const CW = PW - ML * 2;
const BOTTOM = V3.page.contentBottomMm;

const SERIF: RunStyle = { family: 'serif' };
const SERIF_BOLD: RunStyle = { family: 'serif', bold: true };
const SANS: RunStyle = { family: 'sans' };
const SANS_BOLD: RunStyle = { family: 'sans', bold: true };

export const MILAN_RENDERER_VERSION = 'kundli-milan-report-renderer-v1';

/** Count pages of a Milan PDF using the same MuPDF build as the QA toolkit. */
export async function countMilanPdfPages(buffer: Uint8Array | Buffer): Promise<number> {
  try {
    const mupdf = (await import('mupdf')) as any;
    const doc = mupdf.Document.openDocument(Buffer.from(buffer), 'application/pdf');
    return doc.countPages() || 0;
  } catch {
    return 0;
  }
}

export interface MilanPdfOptions {
  locale?: 'en' | 'hi' | 'hi-en';
  mode?: 'CLIENT' | 'PANDIT' | 'SCHOLAR';
  creationDate?: Date;
}

export type MilanPdfMode = NonNullable<MilanPdfOptions['mode']>;

function firstBaseline(y: number, size: number): number {
  return y + ptToMm(size * BASELINE_EM);
}

function lineMmFor(size: number): number {
  if (size <= V3.typography.sizes.micro) return V3.spacing.microLineMm;
  if (size <= V3.typography.sizes.small) return V3.spacing.tightLineMm;
  return V3.spacing.lineMm;
}

/**
 * Draw a word-wrapped paragraph on one page. Returns the new y after the
 * paragraph. Callers are responsible for page breaks (PDF pages do not auto
 * break here because the surface is a raw drawing surface).
 */
function drawParagraph(
  s: PdfSurfaceV3,
  text: string,
  x: number,
  y: number,
  width: number,
  size: number,
  style: RunStyle,
  color: Rgb = V3.colors.ink,
  trackingMm = 0
): number {
  const lineMm = lineMmFor(size);
  const tokens = text.replace(/\r\n?/g, '\n').split(/\s+|\n/).filter(Boolean);
  let line = '';
  let baseline = firstBaseline(y, size);
  let cx = x;
  const drawLine = () => {
    if (line.length === 0) return;
    const laid = s.layoutSingle(line, style, size, trackingMm);
    s.drawLine(laid, cx, baseline, { size, style, color, trackingMm });
    baseline += lineMm;
  };

  for (const token of tokens) {
    const probe = line.length ? `${line} ${token}` : token;
    if (s.measureMm(probe, style, size, trackingMm) <= width) {
      line = probe;
    } else {
      drawLine();
      line = token;
    }
  }
  drawLine();
  return baseline - lineMm + lineMm;
}

/** Draw a small uppercase label with the scholarly running voice. */
function drawLabel(
  s: PdfSurfaceV3,
  text: string,
  x: number,
  y: number,
  color: Rgb = V3.colors.gold
): number {
  return drawParagraph(
    s, text.toUpperCase(), x, y, CW,
    V3.typography.sizes.micro, SANS_BOLD, color, V3.typography.smallCapsTrackingMm,
  );
}

function editionTitle(mode: MilanPdfMode, locale: string): string {
  switch (mode) {
    case 'CLIENT':
      return locale === 'hi' ? 'जातक पाठ · CLIENT EDITION' : 'CLIENT EDITION';
    case 'PANDIT':
      return locale === 'hi' ? 'पण्डित कार्यपत्र · PANDIT EDITION' : 'PANDIT EDITION';
    default:
      return locale === 'hi' ? 'शास्त्री संस्करण · SCHOLAR EDITION' : 'SCHOLAR EDITION';
  }
}

function heading(s: PdfSurfaceV3, text: string, y: number): number {
  s.line(ML, y, PW - ML, y, V3.colors.gold, V3.heading.sectionRuleWidthMm);
  const h = drawParagraph(s, text, ML, y + 4, CW, V3.typography.sizes.h3, SANS_BOLD);
  return h + V3.spacing.blockGapMm;
}

function row(
  s: PdfSurfaceV3,
  name: string,
  detail: string,
  points: number,
  max: number,
  verdict: string,
  y: number,
  zebra: boolean
): [number, number] {
  const rowH = 10;
  const left = ML;
  const col1 = 42;
  const col2 = 106;
  const col3 = 24;
  const col4 = CW - col1 - col2 - col3;
  if (zebra) s.fillRect(left, y, CW, rowH, V3.colors.tableZebra);
  s.strokeRect(left, y, CW, rowH, V3.colors.ruleFaint, 0.1);

  const cy = y + 1.6;
  drawParagraph(s, name, left + 2, cy, col1 - 4, V3.typography.sizes.table, SANS_BOLD);
  drawParagraph(s, detail, left + col1, cy, col2 - 4, V3.typography.sizes.table, SERIF);
  drawParagraph(s, `${points}/${max}`, left + col1 + col2, cy, col3 - 4, V3.typography.sizes.table, SANS_BOLD);
  const verdictColor = verdict === 'Dosha' ? V3.colors.vermilion : verdict === 'Low' ? V3.colors.inkSoft : V3.colors.ink;
  drawParagraph(s, verdict.toUpperCase(), left + col1 + col2 + col3, cy, col4 - 4, V3.typography.sizes.micro, SANS_BOLD, verdictColor);
  return [y + rowH, rowH];
}

function predictionBox(
  s: PdfSurfaceV3,
  p: PredictionBlock,
  y: number,
  locale: string
): number {
  const hasHi = locale === 'hi' || locale === 'hi-en';
  const tx = (en: string, hi = '') => (hasHi && hi ? hi : en);
  const headingH = drawParagraph(
    s,
    tx(p.title, p.titleHi),
    ML, y, CW, V3.typography.sizes.h2, SERIF_BOLD,
  );
  y = headingH + V3.spacing.blockGapMm;
  s.fillRect(ML, y, 2.2, 4, V3.colors.gold);
  y = drawParagraph(s, tx('Traditional reading', 'पारंपरिक पाठ'), ML + 4, y, CW - 4, V3.typography.sizes.micro, SANS_BOLD, V3.colors.gold) + 1;
  y = drawParagraph(s, tx(p.traditionalClaim, p.traditionalClaimHi), ML, y + 2, CW, V3.typography.sizes.body, SERIF) + 2;
  y = drawParagraph(s, tx('Why it matters', 'क्यों मायने रखता है'), ML, y, CW, V3.typography.sizes.small, SANS_BOLD, V3.colors.inkSoft) + 1;
  y = drawParagraph(s, tx(p.explanation, p.explanationHi), ML, y, CW, V3.typography.sizes.body, SERIF) + 2;
  y = drawParagraph(s, tx('What it means for you', 'आपके लिए अर्थ'), ML, y, CW, V3.typography.sizes.small, SANS_BOLD, V3.colors.inkSoft) + 1;
  y = drawParagraph(s, tx(p.motivation, p.motivationHi), ML, y, CW, V3.typography.sizes.body, SERIF) + 2;
  y = drawParagraph(s, tx('Please keep in mind', 'कृपया ध्यान रखें'), ML, y, CW, V3.typography.sizes.small, SANS_BOLD, V3.colors.vermilion) + 1;
  y = drawParagraph(s, tx(p.caution, p.cautionHi), ML, y, CW, V3.typography.sizes.body, SERIF) + 2;
  y = drawParagraph(s, tx('Best possible scenario', 'सर्वोत्तम संभव स्थिति'), ML, y, CW, V3.typography.sizes.small, SANS_BOLD, V3.colors.inkSoft) + 1;
  y = drawParagraph(s, tx(p.bestScenario, p.bestScenarioHi), ML, y, CW, V3.typography.sizes.body, SERIF) + 2;
  y = drawParagraph(s, tx('Ask our astrologer', 'हमारे ज्योतिषी से पूछें'), ML, y, CW, V3.typography.sizes.small, SANS_BOLD, V3.colors.gold) + 1;
  y = drawParagraph(s, tx(p.askAstrologer, p.askAstrologerHi), ML, y, CW, V3.typography.sizes.body, SERIF, V3.colors.gold) + V3.spacing.sectionGapMm;
  return y;
}

function footer(s: PdfSurfaceV3, calc: MilanCalculation, pageTitle: string, page: number): void {
  s.line(ML, PH - 18, PW - ML, PH - 18, V3.colors.ruleFaint, V3.heading.sectionRuleWidthMm);
  drawParagraph(
    s,
    'COSMICTANTRA · KUNDLI MILAN · Classical reading, not a promise',
    ML, PH - 16, CW * 0.7, V3.typography.sizes.footer, SANS, V3.colors.inkFaint,
  );
  drawParagraph(
    s,
    `${pageTitle} — ${page}`,
    ML + CW * 0.72, PH - 16, CW * 0.28, V3.typography.sizes.footer, SANS, V3.colors.inkFaint,
  );
}

/**
 * Generate the Milan PDF from a completed calculation.
 * @returns PDF bytes.
 */
export async function generateMilanPdf(
  calc: MilanCalculation,
  options: MilanPdfOptions = {}
): Promise<Uint8Array> {
  const locale = options.locale ?? 'en';
  const mode = options.mode ?? 'SCHOLAR';
  const fonts = FontStack.fromDisk();
  const s = new PdfSurfaceV3({
    widthMm: PW,
    heightMm: PH,
    fonts,
    title: `Kundli Milan — ${calc.bride.rashiName} & ${calc.groom.rashiName}`,
    subject: `CosmicTantra Kundli Milan V42 · ${editionTitle(mode, locale)}`,
    keywords: 'kundli, milan, ashtakoota, 36 guna, vedic astrology',
    creationDate: options.creationDate,
  });

  const isHindi = locale === 'hi' || locale === 'hi-en';
  const sTitle = isHindi ? 'कॉस्मिकटंत्र कुंडली मिलान' : 'COSMICTANTRA KUNDLI MILAN';
  const sSubtitle = isHindi
    ? 'अष्टकूट — 36 गुण शास्त्रीय मेल'
    : 'Ashtakoota — the classical 36-Guna matching instrument';

  /* ------------------------- PAGE 1: COVER ------------------------- */
  s.fillRect(0, 0, PW, PH, V3.colors.parchment);
  s.fillRect(0, 0, PW, 6, V3.colors.gold);
  s.fillRect(0, PH - 6, PW, 6, V3.colors.gold);

  let y = 50;
  y = drawParagraph(s, sTitle, ML, y, CW, V3.typography.sizes.coverTitle, SERIF_BOLD) + 4;
  y = drawParagraph(s, sSubtitle, ML, y, CW, V3.typography.sizes.coverSubtitle, SERIF, V3.colors.inkSoft) + 2;
  y = drawLabel(s, editionTitle(mode, locale), ML, y) + 8;
  s.line(ML, y, PW - ML, y, V3.colors.gold, V3.heading.sectionRuleWidthMm);

  y += 12;
  y = drawParagraph(s, calc.bride.rashiName, ML, y, CW * 0.45, V3.typography.sizes.coverName, SERIF_BOLD);
  y = drawParagraph(s, calc.groom.rashiName, ML + CW * 0.55, y, CW * 0.45, V3.typography.sizes.coverName, SERIF_BOLD);
  y += 4;
  y = drawParagraph(s, `${calc.bride.nakshatraName} · ${calc.groom.nakshatraName}`, ML, y, CW, V3.typography.sizes.coverMeta, SERIF, V3.colors.inkSoft) + 10;

  y = drawLabel(s, 'CLASSICAL SCORE', ML, y) + 2;
  const totalStr = `${calc.total} / ${calc.maxTotal}`;
  y = drawParagraph(s, totalStr, ML, y, CW, 34, SERIF_BOLD) + 2;
  y = drawParagraph(
    s,
    locale === 'hi' && calc.verdict.titleHi ? calc.verdict.titleHi : calc.verdict.title,
    ML, y, CW, V3.typography.sizes.h2, SANS_BOLD, V3.colors.vermilion,
  ) + 3;
  y = drawParagraph(
    s,
    locale === 'hi' && calc.verdict.summaryHi ? calc.verdict.summaryHi : calc.verdict.summary,
    ML, y, CW, V3.typography.sizes.body, SERIF,
  ) + 8;

  y = drawLabel(s, 'CHART INPUTS', ML, y) + 2;
  const rows: Array<[string, string]> = [
    ['Moon rashi', `${calc.bride.rashiName} & ${calc.groom.rashiName}`],
    ['Janma nakshatra', `${calc.bride.nakshatraName} — pada ${calc.bride.pada}  &  ${calc.groom.nakshatraName} — pada ${calc.groom.pada}`],
    ['Kootas', 'Varna 1 · Vashya 2 · Tara 3 · Yoni 4 · Graha Maitri 5 · Gana 6 · Bhakoot 7 · Nadi 8 = 36'],
  ];
  for (const [k, v] of rows) {
    y = drawParagraph(s, k.toUpperCase(), ML, y, 42, V3.typography.sizes.small, SANS_BOLD, V3.colors.inkSoft);
    y = drawParagraph(s, v, ML + 46, y, CW - 46, V3.typography.sizes.small, SERIF) + 2;
  }

  footer(s, calc, 'Cover', 1);

  /* ------------------------- PAGE 2: SCORE + KOOTAS ------------------------- */
  s.addPage();
  s.fillRect(0, 0, PW, PH, V3.colors.parchment);
  y = 24;
  y = heading(s, locale === 'hi' ? 'कूट विवरण — 36 गुण' : 'KOOTA BREAKDOWN — 36 GUNA', y);
  let zebra = false;
  for (const k of calc.kootas) {
    if (y + 12 > BOTTOM) {
      footer(s, calc, 'Koota breakdown', s.pageCount);
      s.addPage();
      s.fillRect(0, 0, PW, PH, V3.colors.parchment);
      y = 24;
    }
    const [, h] = row(s, k.sanskrit || k.name, k.detail, k.points, k.maxPoints, k.verdict, y, zebra);
    y += h + 0.6;
    zebra = !zebra;
  }

  y += 6;
  y = drawLabel(s, 'DOSHA SUMMARY', ML, y) + 2;
  for (const d of calc.doshas) {
    if (y + 14 > BOTTOM) {
      footer(s, calc, 'Dosha summary', s.pageCount);
      s.addPage();
      s.fillRect(0, 0, PW, PH, V3.colors.parchment);
      y = 24;
    }
    const status = d.active ? (d.cancelled ? 'CANCELLED' : 'ACTIVE') : 'CLEAR';
    const color = d.active ? (d.cancelled ? V3.colors.gold : V3.colors.vermilion) : V3.colors.inkSoft;
    y = drawParagraph(s, `${d.name} — ${status.toUpperCase()}`, ML, y, CW, V3.typography.sizes.h3, SANS_BOLD, color) + 1;
    y = drawParagraph(s, locale === 'hi' && d.reasonHi ? d.reasonHi : d.reason, ML, y, CW, V3.typography.sizes.body, SERIF) + 3;
  }

  y += 4;
  y = drawLabel(s, 'SUPPLEMENTAL DOSHA LAYER (MANGAL · RAJJU · VEDHA · KALA SARPA)', ML, y) + 2;
  for (const d of calc.supplementalDoshas) {
    if (y + 14 > BOTTOM) {
      footer(s, calc, 'Supplemental dosha layer', s.pageCount);
      s.addPage();
      s.fillRect(0, 0, PW, PH, V3.colors.parchment);
      y = 24;
    }
    const status = d.active ? (d.cancelled ? 'CANCELLED' : 'ACTIVE') : 'CLEAR';
    const color = d.active ? (d.cancelled ? V3.colors.gold : V3.colors.vermilion) : V3.colors.inkSoft;
    y = drawParagraph(s, `${d.name} — ${status.toUpperCase()}`, ML, y, CW, V3.typography.sizes.h3, SANS_BOLD, color) + 1;
    y = drawParagraph(s, locale === 'hi' && d.reasonHi ? d.reasonHi : d.reason, ML, y, CW, V3.typography.sizes.body, SERIF) + 3;
  }

  y += 4;
  y = drawLabel(s, 'DEEPER-CHART SYNTHESIS', ML, y) + 2;
  y = drawParagraph(s, locale === 'hi' && calc.synthesis.summaryHi ? calc.synthesis.summaryHi : calc.synthesis.summary, ML, y, CW, V3.typography.sizes.body, SERIF) + V3.spacing.blockGapMm;
  if (y + 24 < BOTTOM) {
    const s7 = calc.synthesis.seventhHouse;
    if (s7.brideSign && s7.groomSign) {
      y = drawParagraph(s, `${s7.brideSign} — ${s7.groomSign}`, ML, y, CW, V3.typography.sizes.small, SANS_BOLD, V3.colors.inkSoft) + 2;
    }
  }
  footer(s, calc, 'Koota breakdown + synthesis', s.pageCount);

  /* ------------------------- PAGE 3+: PREDICTIONS ------------------------- */
  s.addPage();
  s.fillRect(0, 0, PW, PH, V3.colors.parchment);
  y = 24;
  y = heading(s, locale === 'hi' ? 'पारंपरिक पाठ — समझें, पूछें' : 'TRADITIONAL READING — EXPLANATION, MOTIVATION, CONSULTATION', y);
  for (const p of calc.predictions) {
    if (y + 8 > BOTTOM) {
      footer(s, calc, 'Traditional reading', s.pageCount);
      s.addPage();
      s.fillRect(0, 0, PW, PH, V3.colors.parchment);
      y = 24;
    }
    y = predictionBox(s, p, y, locale);
  }
  footer(s, calc, 'Traditional reading', s.pageCount);

  /* ------------------------- LAST PAGE: SOURCES ---------- */
  s.addPage();
  s.fillRect(0, 0, PW, PH, V3.colors.parchment);
  y = 24;
  y = heading(s, locale === 'hi' ? 'स्रोत और सीमाएँ' : 'SOURCES AND LIMITS', y);
  const paras = [
    'The eight-koota tables are the conventional Ashtakoota grids used by North-Indian match-making, cross-checked against Brihat Parashara Hora Shastra (Ashtakoota doctrine), Phaladeepika (Gana / Nadi discussion) and Muhurta Chintamani as commonly cited.',
    'Milan reads the Moon nakshatra/rashi of the two charts. It does not replace Mangal Dosha, Rajju, Vedha, Kala Sarpa, the D9 Navamsha or the seventh-house synthesis.',
    'The score out of 36 is a traditional summary, not a scientific measurement and not a prediction. Dosha does not equal doom. For the full chart, please ask our astrologer.',
  ];
  for (const p of paras) {
    y = drawParagraph(s, p, ML, y, CW, V3.typography.sizes.body, SERIF) + V3.spacing.blockGapMm;
  }
  footer(s, calc, 'Sources', s.pageCount);

  return s.finish();
}
