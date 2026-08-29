import { test, expect } from '@playwright/test';
import { professionalChart } from '../src/lib/pro/index.js';
import { buildBook, BOOK_VARIANTS, RENDER_TARGET } from '../src/lib/pro/bookModel.js';
import { bookToHTML, bookToWebModel } from '../src/lib/pro/renderers.js';
import { synthesizeInterpretation, containsBannedProse } from '../src/lib/pro/interpret.js';

const BP = { birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna' };

function pro() { return professionalChart(BP); }

test.describe('TRUST-03 — KundliBookModel (renderer-independent)', () => {
  test('all five variants build with provenance', () => {
    for (const key of Object.keys(BOOK_VARIANTS)) {
      const sections = key === 'CUSTOM' ? ['cover', 'birthDetails', 'interpretation'] : undefined;
      const book = buildBook(key, { pro: pro(), meta: { name: 'Test', birthTimeConfidence: 'EXACT' }, sections });
      expect(book.variant).toBe(key);
      expect(book.provenance).toBeTruthy();
      expect(book.provenance.birth.date).toBe('1995-06-15');
      expect(book.provenance.versions.engineVersion).toBeTruthy();
      expect(book.provenance.conventions.length).toBeGreaterThan(0);
    }
  });

  test('every book carries full birth + convention + version + timestamp provenance', () => {
    const book = buildBook('COMPLETE_VEDIC_KUNDLI', { pro: pro(), meta: { name: 'Test', birthTimeConfidence: 'EXACT' } });
    const p = book.provenance;
    expect(p.birth.latitude).toBeCloseTo(25.5941, 3);
    expect(p.birth.timezone).toBe(5.5);
    expect(p.ayanamsha).toContain('LAHIRI');
    expect(p.generatedAt).toBeTruthy();
    expect(p.qualification.externalQualification).toContain('PENDING_EXTERNAL_REFERENCE');
  });

  test('the SAME book renders to WEB, PRINT and PDF', () => {
    const book = buildBook('PERSONAL_KUNDLI', { pro: pro(), meta: { name: 'Test' } });
    const web = bookToHTML(book, RENDER_TARGET.WEB);
    const print = bookToHTML(book, RENDER_TARGET.PRINT);
    const pdf = bookToHTML(book, RENDER_TARGET.PDF);
    for (const html of [web, print, pdf]) {
      expect(html).toContain('Calculation Identity'); // provenance always rendered
      expect(html).toContain('Leo'); // deterministic lagna present
    }
    const model = bookToWebModel(book);
    expect(model.sections.length).toBeGreaterThan(0);
    expect(model.provenance).toBeTruthy();
  });
});

test.describe('TRUST-03 — Interpretation is evidence→rule→synthesis (no generic filler)', () => {
  test('every claim has calculated evidence and a named rule', () => {
    const sec = synthesizeInterpretation(pro());
    expect(sec.method).toBe('EVIDENCE → RULE → SYNTHESIS');
    expect(sec.claims.length).toBeGreaterThan(0);
    for (const c of sec.claims) {
      expect(c.evidence.length).toBeGreaterThan(0);
      for (const e of c.evidence) {
        expect(e.fact).toBeTruthy();
        expect(e.source).toBeTruthy(); // every fact cites where it came from
      }
      expect(c.synthesis).toBeTruthy();
    }
  });

  test('no banned marketing / generic prose appears in the rendered book', () => {
    const book = buildBook('COMPLETE_VEDIC_KUNDLI', { pro: pro(), meta: { name: 'Test' } });
    const html = bookToHTML(book).toLowerCase();
    expect(containsBannedProse(html)).toBe(false);
    // spot-check specific banned phrases
    for (const phrase of ['99% accurate', '500 yogas', "world's best", 'as an ai']) {
      expect(html.includes(phrase)).toBe(false);
    }
  });

  test('ledger-only mode omits synthesis, keeps evidence + rules (for Pandits)', () => {
    const sec = synthesizeInterpretation(pro(), { ledgerOnly: true });
    expect(sec.ledgerOnly).toBe(true);
    const book = buildBook('PANDIT_TECHNICAL_BOOK', { pro: pro(), meta: { name: 'Test' } });
    const ledger = book.sections.find((s: any) => s.type === 'interpretation');
    expect(ledger).toBeTruthy();
  });
});
