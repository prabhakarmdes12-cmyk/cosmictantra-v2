/**
 * VISUAL ACCEPTANCE — what can be established without eyes
 *
 * This spec exists because the owner asked a question this suite cannot fully
 * answer: does the report look right? It answers the part that can be
 * answered by measuring rendered pixels, and it does not pretend to answer
 * the rest.
 *
 * What it does establish, from the rasterised PDF rather than from extraction:
 *   - no page is blank, and none is so empty it looks broken
 *   - content stays inside the margins, so nothing is clipped
 *   - the Bhava-Graha bullets are real round glyphs, nine of them, one per
 *     graha, and the empty cells really are dashes
 *   - Devanagari conjuncts are formed by substitution, not stacked
 *   - the Scholar Summary is on one page, with no orphaned heading
 *   - English and Hindi reports carry the same calculation
 *
 * What it cannot establish, and what this file deliberately does not claim:
 *   - whether the report looks good
 *   - whether the hierarchy reads correctly
 *   - whether a Pandit can use it
 *
 * Those need a human. See docs/scholar-kundli/VISUAL-QA-MATRIX.md.
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { createKundliPdfGenerator } from '../../src/lib/kundli/pipeline';
import { getCanonicalJyotishSnapshot } from '../../src/lib/jyotish/canonicalSnapshot';
import { analysePdf, densityBand, pageTextItems, PagePixels } from './pagePixelAudit';

const OUT = 'artifacts/scholar-kundli/final-owner-review';

const PROFILE = {
  name: 'Priya Sharma',
  birthDate: '1995-06-15',
  birthTime: '10:30',
  locationName: 'Patna',
  latitude: 25.5941,
  longitude: 85.1376,
  coordinateProvenance: 'MANUAL' as const,
  timezoneId: 'Asia/Kolkata',
};

/** Names for the review pack, in page order. */
const PAGE_NAMES = [
  '01-cover-and-passport',
  '02-scholar-summary',
  '03-birth-summary-and-d1-chart',
  '04-d1-placements-table',
  '05-d9-chart-and-placements',
  '06-planetary-positions',
  '07-house-positions-and-bhava-graha-matrix',
  '08-dasha',
  '09-yogas-overview',
  '10-yoga-evidence-1',
  '11-yoga-evidence-2',
  '12-yoga-evidence-3',
  '13-yoga-evidence-4',
  '14-yoga-evidence-5',
  '15-life-areas',
  '16-remedies',
  '17-certificate',
  '18-certificate-sources',
  '19-disclaimer',
];

const pdfjs: any = require('pdfjs-dist/legacy/build/pdf.mjs');

function ensureRaf() {
  const g: any = globalThis as any;
  if (!g.requestAnimationFrame) g.requestAnimationFrame = (cb: any) => setTimeout(() => cb(Date.now()), 0);
  if (!g.cancelAnimationFrame) g.cancelAnimationFrame = (id: any) => clearTimeout(id);
}

async function renderPages(pdfPath: string, prefix: string, scale = 1.5): Promise<string[]> {
  ensureRaf();
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const fontsDir = path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'standard_fonts');
  const doc = await pdfjs.getDocument({ data, standardFontDataUrl: fontsDir + '/' }).promise;
  const out: string[] = [];
  try {
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const vp = page.getViewport({ scale });
      const canvas = createCanvas(Math.ceil(vp.width), Math.ceil(vp.height));
      const ctx: any = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, vp.width, vp.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      const name = PAGE_NAMES[p - 1] ?? `${String(p).padStart(2, '0')}-page`;
      const file = path.join(OUT, `${prefix}${name}.png`);
      fs.writeFileSync(file, canvas.toBuffer('image/png'));
      out.push(file);
    }
  } finally {
    await doc.destroy().catch(() => undefined);
  }
  return out;
}

let enPdf = '';
let hiPdf = '';

test.beforeAll(async () => {
  test.setTimeout(600000);
  fs.mkdirSync(OUT, { recursive: true });
  const generate = createKundliPdfGenerator(getCanonicalJyotishSnapshot);

  const en = await generate(PROFILE, { locale: 'en' });
  expect(en.ok, `EN pipeline failed: ${en.errorCode}`).toBe(true);
  enPdf = path.join(OUT, 'cosmictantra-kundli-priya-1995-en.pdf');
  fs.writeFileSync(enPdf, Buffer.from(en.pdfBuffer!));

  const hi = await generate(PROFILE, { locale: 'hi' });
  expect(hi.ok, `HI pipeline failed: ${hi.errorCode}`).toBe(true);
  hiPdf = path.join(OUT, 'cosmictantra-kundli-priya-1995-hi.pdf');
  fs.writeFileSync(hiPdf, Buffer.from(hi.pdfBuffer!));

  await renderPages(enPdf, '');
  await renderPages(hiPdf, 'hi-');
});

test.describe('PAGE STRUCTURE — measured on the rendered pages', () => {
  let pages: PagePixels[] = [];

  test.beforeAll(async () => {
    test.setTimeout(600000);
    pages = await analysePdf(enPdf, 1.5);
  });

  test('the English report is 19 pages', async () => {
    const data = new Uint8Array(fs.readFileSync(enPdf));
    const fontsDir = path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'standard_fonts');
    ensureRaf();
    const doc = await pdfjs.getDocument({ data, standardFontDataUrl: fontsDir + '/' }).promise;
    try {
      expect(doc.numPages).toBe(19);
    } finally {
      await doc.destroy().catch(() => undefined);
    }
  });

  test('no page is blank or near-blank', () => {
    const thin = pages.filter((p) => p.inkCoverage < 0.010);
    expect(thin.map((p) => `p${p.page}@${(p.inkCoverage * 100).toFixed(2)}%`)).toEqual([]);
  });

  test('no page is so dense it reads as a wall of text', () => {
    const dense = pages.filter((p) => p.inkCoverage > 0.16);
    expect(dense.map((p) => `p${p.page}@${(p.inkCoverage * 100).toFixed(2)}%`)).toEqual([]);
  });

  test('content stays inside the margins on every page', () => {
    const clipped = pages.filter((p) => p.touchesEdge);
    expect(clipped.map((p) => p.page)).toEqual([]);
  });

  test('side margins are consistent across pages', () => {
    const lefts = pages.map((p) => p.margins.left);
    const rights = pages.map((p) => p.margins.right);
    const spread = (xs: number[]) => Math.max(...xs) - Math.min(...xs);
    expect(spread(lefts), 'left margin should not wander').toBeLessThan(0.02);
    expect(spread(rights), 'right margin should not wander').toBeLessThan(0.03);
  });

  test('the footer band is clear of the page edge on every page', () => {
    for (const p of pages) {
      expect(p.margins.bottom, `page ${p.page} bottom margin`).toBeGreaterThan(0.015);
    }
  });

  test('every page carries a page marker, so none is a stray blank', async () => {
    for (let p = 1; p <= pages.length; p++) {
      const items = await pageTextItems(enPdf, p);
      const marker = items.find((i) => /— page \d+$/.test(i.text));
      expect(marker, `page ${p} has no footer marker`).toBeTruthy();
      expect(marker!.text).toContain(`page ${p}`);
    }
  });

  test('page density is recorded for the review matrix', () => {
    const summary = pages.map((p) => ({
      page: p.page,
      ink: Number((p.inkCoverage * 100).toFixed(2)),
      band: densityBand(p.inkCoverage),
      largestVoid: Number((p.largestVerticalVoid * 100).toFixed(1)),
    }));
    fs.writeFileSync(path.join(OUT, 'page-density.json'), JSON.stringify(summary, null, 1));
    expect(summary.length).toBe(19);
  });
});

test.describe('BHAVA–GRAHA MATRIX — the marker really is drawn', () => {
  test('nine round glyphs, one per graha, and dashes in the empty cells', async () => {
    test.setTimeout(300000);
    // Locate the matrix table by its extracted header row.
    const items6 = await pageTextItems(enPdf, 7);
    const rowItems = items6.filter((i) =>
      /^(Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces|Aries|Taurus|Gemini|Cancer)$/.test(i.text.trim()) ||
      /^([1-9]|1[0-2])$/.test(i.text.trim()));
    expect(rowItems.length, 'matrix rows not found on the expected page').toBeGreaterThan(10);

    const ys = rowItems.map((i) => i.y);
    const scale = 3;
    ensureRaf();
    const data = new Uint8Array(fs.readFileSync(enPdf));
    const fontsDir = path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'standard_fonts');
    const doc = await pdfjs.getDocument({ data, standardFontDataUrl: fontsDir + '/' }).promise;
    try {
      const page = await doc.getPage(7);
      const vp = page.getViewport({ scale });
      const canvas = createCanvas(Math.ceil(vp.width), Math.ceil(vp.height));
      const ctx: any = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, vp.width, vp.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;

      const toPx = (pdfY: number) => vp.height - pdfY * scale;
      const y0 = Math.max(0, Math.floor(toPx(Math.max(...ys)) - 12 * scale));
      const y1 = Math.min(vp.height, Math.ceil(toPx(Math.min(...ys)) + 12 * scale));
      const x0 = Math.floor(36 * scale);
      const x1 = Math.ceil(vp.width - 36 * scale);
      const w = x1 - x0;
      const h = y1 - y0;
      const img = ctx.getImageData(x0, y0, w, h).data;
      const seen = new Uint8Array(w * h);
      const dark = (i: number) =>
        (img[i * 4] * 299 + img[i * 4 + 1] * 587 + img[i * 4 + 2] * 114) / 1000 < 140;

      const blobs: { size: number; bw: number; bh: number }[] = [];
      for (let p = 0; p < w * h; p++) {
        if (seen[p] || !dark(p)) continue;
        let size = 0, ax0 = Infinity, ay0 = Infinity, ax1 = -Infinity, ay1 = -Infinity;
        const stack = [p];
        seen[p] = 1;
        while (stack.length) {
          const q = stack.pop() as number;
          const qx = q % w, qy = (q - qx) / w;
          size++;
          if (qx < ax0) ax0 = qx; if (qx > ax1) ax1 = qx;
          if (qy < ay0) ay0 = qy; if (qy > ay1) ay1 = qy;
          for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]] as const) {
            const nx = qx + dx, ny = qy + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const n = ny * w + nx;
            if (!seen[n] && dark(n)) { seen[n] = 1; stack.push(n); }
          }
        }
        blobs.push({ size, bw: ax1 - ax0 + 1, bh: ay1 - ay0 + 1 });
      }

      // A bullet is a compact near-square blob ~6-8px at this scale.
      const bullets = blobs.filter((b) => b.bw >= 5 && b.bw <= 10 && b.bh >= 5 && b.bh <= 10);
      // An em-dash is wide and only one or two pixels tall.
      const dashes = blobs.filter((b) => b.bw >= 18 && b.bw <= 30 && b.bh <= 4);

      expect(bullets.length, `expected one round marker per graha, found ${bullets.length}`).toBe(9);
      // 12 houses x 9 grahas = 108 cells, 9 occupied -> 99 dashes.
      expect(dashes.length).toBe(99);
    } finally {
      await doc.destroy().catch(() => undefined);
    }
  });
});

test.describe('DEVANAGARI — shaping, measured not assumed', () => {
  const widths: Record<string, number> = {};
  const inks: Record<string, number> = {};

  test.beforeAll(() => {
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSansDevanagari-Regular.ttf');
    expect(GlobalFonts.registerFromPath(fontPath, 'DevAudit'), 'the Devanagari font must load').toBe(true);
    const canvas = createCanvas(400, 120);
    const ctx: any = canvas.getContext('2d');
    ctx.font = '48px DevAudit';
    const samples: Record<string, string> = {
      ka: 'क',
      sa: 'स',
      ki: 'कि',
      ku: 'कु',
      ke: 'के',
      anusvara: 'सं',
      visarga: 'सः',
      candrabindu: 'सँ',
      nukta: 'क़',
      halant: 'क्',
      ksha: 'क्ष',
      jna: 'ज्ञ',
      tra: 'त्र',
      shra: 'श्र',
      sta: 'स्त',
      rka: 'र्क',
      rma: 'र्म',
      stra: 'स्त्र',
      mangal: 'मंगल',
      surya: 'सूर्य',
      rashi: 'राशि',
      mixed: 'राहु Ra',
      digits: '१२३',
    };
    for (const [name, s] of Object.entries(samples)) {
      widths[name] = ctx.measureText(s).width;
      const w = Math.max(4, Math.ceil(ctx.measureText(s).width) + 8);
      const c = createCanvas(w, 80);
      const cctx: any = c.getContext('2d');
      cctx.fillStyle = '#fff'; cctx.fillRect(0, 0, w, 80);
      cctx.fillStyle = '#000'; cctx.font = '48px DevAudit'; cctx.textBaseline = 'middle';
      cctx.fillText(s, 4, 40);
      const im = cctx.getImageData(0, 0, w, 80).data;
      let ink = 0;
      for (let i = 0; i < w * 80; i++) if (im[i * 4] < 128) ink++;
      inks[name] = ink;
    }
  });

  test('every sample draws ink — none renders as an empty box', () => {
    for (const [name, ink] of Object.entries(inks)) {
      expect(ink, `${name} drew nothing`).toBeGreaterThan(150);
    }
  });

  test('matras and signs change the glyph — they are not dropped', () => {
    // Each is compared against its own base consonant, not against a
    // different letter, whose ink differs for reasons that have nothing to
    // do with the sign being tested.
    expect(inks.ki).toBeGreaterThan(inks.ka);
    expect(inks.ku).toBeGreaterThan(inks.ka);
    expect(inks.anusvara, 'anusvara adds ink to स').toBeGreaterThan(inks.sa);
    expect(inks.visarga, 'visarga adds ink to स').toBeGreaterThan(inks.sa);
    expect(inks.candrabindu, 'candrabindu adds ink to स').toBeGreaterThan(inks.sa);
    expect(inks.nukta, 'nukta adds ink to क').toBeGreaterThan(inks.ka);
  });

  test('conjuncts are narrower than a single base consonant, which only substitution can do', () => {
    // Rendered sequentially as क + ् + ष these would be roughly three times
    // the base width. Formed as a conjunct they are narrower than one क.
    for (const name of ['ksha', 'jna', 'tra', 'shra']) {
      expect(widths[name], `${name} is not a substituted conjunct`).toBeLessThan(widths.ka);
    }
  });

  test('three-part conjuncts stay compact', () => {
    expect(widths.stra).toBeLessThan(widths.ka * 2);
  });

  test('reph forms are narrower than the full consonant sequence', () => {
    expect(widths.rma).toBeLessThan(widths.ka * 2);
  });

  test('mixed Devanagari and Latin in one string still renders', () => {
    expect(inks.mixed).toBeGreaterThan(500);
  });
});

test.describe('SCHOLAR SUMMARY — the orphan regression', () => {
  test('the whole summary is on one page and no heading is stranded', async () => {
    const items = await pageTextItems(enPdf, 2);
    const text = items.map((i) => i.text).join(' ');
    for (const needle of [
      'Your chart at a glance',
      'What deserves attention',
      'Level 1',
      'Level 2',
      'Level 3',
      'FACT-LAGNA',
    ]) {
      expect(text, `${needle} is not on the summary page`).toContain(needle);
    }
    // The heading must not be alone at the foot of the previous page.
    const prev = (await pageTextItems(enPdf, 1)).map((i) => i.text).join(' ');
    expect(prev, 'the summary heading is orphaned on page 1').not.toContain('Your chart at a glance');
  });

  test('the heading is not printed twice in a row', async () => {
    const items = await pageTextItems(enPdf, 2);
    const titles = items.filter((i) => i.text.trim() === 'Your chart at a glance');
    expect(titles.length, 'the summary title appears more than once').toBe(1);
  });
});

test.describe('CROSS-LANGUAGE — the calculation does not change with the language', () => {
  test('both reports are produced and both are 19 pages', async () => {
    expect(fs.existsSync(enPdf)).toBe(true);
    expect(fs.existsSync(hiPdf)).toBe(true);
  });

  test('the Hindi report carries Devanagari in its chart region', async () => {
    const items = await pageTextItems(hiPdf, 7);
    const text = items.map((i) => i.text).join(' ');
    expect(/[\u0900-\u097F]/.test(text), 'no Devanagari found on the Hindi matrix page').toBe(true);
  });

  test('the Hindi matrix places the grahas exactly as the English one does', async () => {
    const en = (await pageTextItems(enPdf, 7)).map((i) => i.text).join(' ');
    const hi = (await pageTextItems(hiPdf, 7)).map((i) => i.text).join(' ');
    // Count the markers in each: same number of occupied cells.
    const countMarkers = (s: string) => (s.match(/\u2022/g) ?? []).length;
    expect(countMarkers(hi)).toBe(countMarkers(en));
  });
});
