/**
 * KUNDLI V42 — MILAN_KUNDLI_CURRENT_RENDERER
 *
 * The release gate for the public Kundli Milan report. It exercises the route
 * handler directly (so no rate-limit / network flakiness is in scope) and
 * asserts:
 *   1. a real PDF is returned for a valid Moon pair;
 *   2. the default is SCHOLAR and all three editions download;
 *   3. the locale reaches the renderer;
 *   4. `inspect` never returns a document (no second unverified download path);
 *   5. invalid input returns an error, never a PDF;
 *   6. the UI carries the edition selector and the consultation CTA.
 */
import { test, expect } from '@playwright/test';
import { POST, GET } from '../../src/app/api/kundli/milan/route';
import { MILAN_RENDERER_VERSION } from '../../src/lib/kundli/v42/milan/milanPdf';
import { inspectPdf } from '../kundli-v40/qa/pdfInspect';

const ROUTE = 'http://localhost/api/kundli/milan';

const BRIDE = { rashiName: 'Taurus', nakshatraName: 'Rohini', pada: 1, rashiLord: 'Venus' };
const GROOM = { rashiName: 'Taurus', nakshatraName: 'Rohini', pada: 2, rashiLord: 'Venus' };

let clientSeq = 0;
const post = (body: unknown, ip?: string) =>
  POST(new Request(ROUTE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip ?? `10.0.0.${(clientSeq += 1) % 250}`,
    },
    body: JSON.stringify(body),
  }));

test.describe.configure({ mode: 'parallel' });

test.describe('MILAN_KUNDLI_CURRENT_RENDERER', () => {
  test('MR-01: a valid pair returns a PDF from the v42 Milan renderer', async () => {
    const res = await post({ bride: BRIDE, groom: GROOM });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(Buffer.from(bytes.slice(0, 5)).toString('latin1')).toBe('%PDF-');
    expect(res.headers.get('X-Milan-Renderer')).toBe(MILAN_RENDERER_VERSION);
    // QA gate: the page count must be a positive real PDF page count.
    const headerPages = Number(res.headers.get('X-Milan-Pages') ?? '0');
    expect(headerPages).toBeGreaterThan(0);
    const inspected = await inspectPdf(bytes);
    expect(inspected.pageCount).toBe(headerPages);
  });

  test('MR-02: default edition is SCHOLAR and all editions download', async () => {
    const one = await post({ bride: BRIDE, groom: GROOM });
    expect(one.headers.get('X-Milan-Mode')).toBe('SCHOLAR');
    for (const mode of ['CLIENT', 'PANDIT', 'SCHOLAR'] as const) {
      const res = await post({ bride: BRIDE, groom: GROOM, mode });
      expect(res.status, `${mode} must download`).toBe(200);
      expect(res.headers.get('X-Milan-Mode')).toBe(mode);
      expect(res.headers.get('X-Milan-Renderer')).toBe(MILAN_RENDERER_VERSION);
    }
  });

  test('MR-03: locale reaches the renderer', async () => {
    const en = await inspectPdf(new Uint8Array(await (await post({ bride: BRIDE, groom: GROOM, locale: 'en' })).arrayBuffer()));
    const hi = await inspectPdf(new Uint8Array(await (await post({ bride: BRIDE, groom: GROOM, locale: 'hi' })).arrayBuffer()));
    expect(hi.allText).not.toBe(en.allText);
    expect(hi.allText).toMatch(/[\u0900-\u097F]/);
  });

  test('MR-04: inspect returns JSON diagnostics, never a document', async () => {
    const res = await post({ bride: BRIDE, groom: GROOM, inspect: true });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/json');
    const body = await res.json();
    expect(body.total).toBe(33);
    expect(body.maxTotal).toBe(36);
    expect(body.kootas.length).toBe(8);
    expect(body.predictions).toContain('dosha');
    expect(body.supplementalDoshas.length).toBe(4);
    expect(body.synthesis.navamsha).toBeTruthy();
    expect(body.rendererVersion).toBe(MILAN_RENDERER_VERSION);
  });

  test('MR-05: invalid input returns an error, never a document', async () => {
    const res = await post({ bride: {}, groom: {} });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.headers.get('Content-Type') ?? '').not.toContain('application/pdf');
  });

  test('MR-05b: canonical Sanskrit rashi names normalize into the English tables', async () => {
    const res = await post({
      bride: { rashiName: 'Mesha', nakshatraName: 'Ashwini', pada: 1 },
      groom: { rashiName: 'Mesha', nakshatraName: 'Bharani', pada: 1 },
      inspect: true,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.kootas.length).toBe(8);
    expect(body.kootas.find((k: any) => k.id === 'bhakoot')?.detail).toContain('Aries');
  });

  test('MR-05c: full birth profiles reach the canonical dosha + synthesis layer', async () => {
    const res = await post({
      brideBirth: {
        birthDate: '1992-11-08', birthTime: '14:45:00',
        latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna, Bihar, India',
      },
      groomBirth: {
        birthDate: '1989-05-26', birthTime: '02:20:30',
        latitude: 22.0797, longitude: 82.1391, timezone: 5.5, locationName: 'Bilaspur, Chhattisgarh, India',
      },
      inspect: true,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.supplementalDoshas.length).toBe(4);
    expect(body.synthesis.navamsha).toBeTruthy();
    expect(body.synthesis.seventhHouse).toBeTruthy();
    expect(body.synthesis.marriageKaraka).toBeTruthy();
  });

  test('MR-06: the route advertises its contract', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.contract.maxTotal).toBe(36);
    expect(body.contract.kootas).toContain('Nadi:8');
    expect(body.contract.modes).toContain('SCHOLAR');
    // Runtime QA gate: mupdf must stay external to the Next server bundle so
    // the live route can count real PDF pages (not just direct-handler tests).
    const cfg = (await import('../../next.config.mjs')).default as any;
    expect(cfg?.experimental?.serverComponentsExternalPackages).toContain('mupdf');
  });

  test('MR-07: the report page exposes tabs, editions and the consultation gate', async ({ page }) => {
    await page.goto('/milan');
    await expect(page.getByRole('heading', { name: 'Ashtakoota Milan' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Qualified PDF edition' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Calculate Milan/i })).toBeVisible();
    // The paid-consultation gate is only rendered after a calculation; the
    // sample-data form is present and the CTA is reachable after computing.
    await page.getByRole('button', { name: /Fill sample/i }).click();
    await page.getByRole('button', { name: /Calculate Milan/i }).click({ timeout: 20_000 });
    // Chart-first Overview tab (Master report parity), then the Folio reading.
    await expect(page.getByRole('tab', { name: /Overview/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Full reading/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Explore deeper/i })).toBeVisible();
    // Novice orientation + always-visible Pandit CTA.
    await expect(page.getByRole('heading', { name: /In plain words/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: /Ask a Pandit/i })).toBeVisible();
    // Complete classical dosha layer is surfaced on Overview (not just Folio).
    await expect(page.getByRole('heading', { name: /Complete classical Milan dosha layer/i })).toBeVisible({ timeout: 20_000 });
    await page.getByRole('tab', { name: /Explore deeper/i }).click();
    await expect(page.getByRole('heading', { name: /Koota workbench/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Deeper-chart synthesis/i })).toBeVisible();
    await page.getByRole('tab', { name: /Full reading/i }).click();
    await expect(page.getByRole('group', { name: 'Reading depth' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Traditional reading — explanation, motivation, then ask' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: /Book a Pandit consultation/i })).toBeVisible();
  });
});
