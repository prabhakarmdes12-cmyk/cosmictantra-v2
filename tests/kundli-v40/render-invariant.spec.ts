/**
 * KUNDLI_INV_RENDER_001 — the renderer never derives a Jyotish fact.
 *
 * The renderer's job is to draw the report model. The moment it starts
 * deciding what a value means — recomputing a house, re-deriving a dignity,
 * inferring a yoga — the evidence chain breaks: the PDF says something the
 * model cannot account for and the appendix cannot trace.
 *
 * This is enforced two ways, because either alone is defeatable:
 *
 *   1. STATICALLY, by grepping the renderer's source for the imports and the
 *      vocabulary of the derivation layer. Crude, but it catches the honest
 *      mistake of reaching for a helper "just this once".
 *
 *   2. BEHAVIOURALLY, by feeding the renderer a model whose values are
 *      deliberately WRONG and asserting the wrong values come out. A renderer
 *      that silently corrects them is deriving.
 *
 * The second is the real test. A renderer cannot both invent facts and
 * faithfully reproduce nonsense.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { renderKundliPdfV3 } from '../../src/lib/kundli/v40/rendererV3';
import { inspectPdf } from './qa/pdfInspect';
import type { KundliReportModelV2 } from '../../src/lib/kundli/v40/reportBlocks';

const RENDERER = path.join(process.cwd(), 'src/lib/kundli/v40/rendererV3.ts');
const SURFACE = path.join(process.cwd(), 'src/lib/kundli/v40/pdf/surface.ts');

/**
 * Modules that compute or interpret Jyotish. The renderer may not import any
 * of them. `northIndianChart` and `chartModel` are NOT on this list: they are
 * geometry and abbreviations over a model the pipeline already built.
 */
const DERIVATION_MODULES = [
  'derivedModel', 'aspectEngine', 'functionalLordship', 'grahaCondition',
  'bhavaIntelligence', 'dashaActivation', 'd10Validation', 'structuralHighlights',
  'panchangaIdentity', 'careerSynthesis', 'consultationQuestions', 'reportModelV2',
  'canonicalModel', 'yogaEngine', 'vargaEngine', 'balaEngine', 'canonicalSnapshot',
];

test('the renderer imports no derivation module', () => {
  const src = fs.readFileSync(RENDERER, 'utf8');
  const imports = [...src.matchAll(/^\s*import[^;]*?from\s+'([^']+)'/gm)].map((m) => m[1]);
  const offenders = imports.filter((i) =>
    DERIVATION_MODULES.some((d) => i === `./${d}` || i.endsWith(`/${d}`)));
  expect(offenders, `rendererV3 imports derivation modules: ${offenders.join(', ')}`).toEqual([]);
});

test('the renderer contains no Jyotish vocabulary outside comments', () => {
  const src = fs.readFileSync(RENDERER, 'utf8');
  // Strip comments: the invariant is about executable code, and the file is
  // heavily documented precisely because the rules are subtle. The PDF
  // `keywords` metadata line is also stripped — those words describe the
  // DOCUMENT to a search index and are the one legitimate place the renderer
  // may name the subject matter.
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/^\s*keywords:.*$/gm, '');

  // Names of grahas, rashis and yogas have no business in layout code. If the
  // renderer knows what "Vrishabha" is, it is one step from deciding what it
  // means.
  const vocabulary = [
    'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula',
    'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
    'Ashwini', 'Bharani', 'Magha', 'Ashadha',
    'yogakaraka', 'exalted', 'debilitat', 'combust', 'vargottama',
    'mahadasha', 'antardasha', 'navamsha', 'dashamsha', 'shadbala', 'ayanamsha',
  ];
  const found = vocabulary.filter((w) => new RegExp(w, 'i').test(code));
  expect(found, `rendererV3 code mentions: ${found.join(', ')}`).toEqual([]);
});

test('the drawing surface knows nothing about astrology either', () => {
  const code = fs.readFileSync(SURFACE, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  for (const w of ['graha', 'rashi', 'bhava', 'nakshatra', 'dasha', 'yoga']) {
    expect(new RegExp(w, 'i').test(code), `surface.ts mentions ${w}`).toBe(false);
  }
});

test('the renderer performs no trigonometry and no date arithmetic', () => {
  const code = fs.readFileSync(RENDERER, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  // Layout is linear: it scales, offsets and clamps. Anything angular is the
  // chart module's job, and anything calendrical is the model's.
  for (const fn of ['Math.sin', 'Math.cos', 'Math.tan', 'Math.atan', 'Date.parse', 'toISOString']) {
    expect(code.includes(fn), `rendererV3 calls ${fn}`).toBe(false);
  }
});

test('BEHAVIOURAL — the renderer faithfully draws values it should know are wrong', async () => {
  // A chart claiming the Sun is in an impossible house, a dignity that
  // contradicts the placement, and a yoga verdict that contradicts its own
  // reason. Every one of these would be corrected by a renderer that thinks.
  const nonsense: KundliReportModelV2 = {
    reportModelVersion: 'kundli-report-v2',
    reportId: 'CT-KUNDLI-INVARIANT-PROBE',
    contentHash: '0'.repeat(64),
    fingerprint: '0000000000000000',
    generatedAt: '2026-01-01T00:00:00.000Z',
    locale: 'en',
    labelMode: 'hi-en',
    engineVersions: {},
    subject: { name: 'Probe', birthDate: '1995-06-15', birthTime: '10:30', locationName: 'Nowhere' },
    sections: [{
      id: 'probe',
      title: 'Invariant probe',
      part: 'A',
      startsNewPage: true,
      status: 'READY',
      blocks: [
        { kind: 'sectionTitle', text: 'Invariant probe' },
        {
          kind: 'table',
          headers: ['Graha', 'Rashi', 'Bhava', 'Dignity'],
          widths: [0.25, 0.25, 0.25, 0.25],
          rows: [
            ['Sun', 'Vrishabha', '99', 'EXALTED_AND_DEBILITATED'],
            ['Moon', 'NotARashi', '-4', 'PURPLE'],
          ],
        },
        { kind: 'paragraph', text: 'Lagna is Simha at 412\u00B071\u2032, which is not an angle.' },
        { kind: 'paragraph', text: 'Vimshottari balance: -3y 14m 40d.' },
      ],
    }],
  };

  const rendered = await renderKundliPdfV3(nonsense, { creationDate: new Date('2026-01-01T00:00:00.000Z') });
  const text = (await inspectPdf(rendered.buffer)).allText.replace(/\s+/g, ' ');
  // A value too long for its column is hard-broken across lines rather than
  // allowed to overflow, so the unspaced form is the one to compare against
  // for long tokens. Breaking a word is a layout decision; changing it is not.
  const unspaced = text.replace(/\s+/g, '');

  // Every impossible value must survive intact.
  expect(text, 'house 99 was silently corrected').toContain('99');
  expect(text, 'a negative house was silently corrected').toContain('-4');
  expect(unspaced).toContain('EXALTED_AND_DEBILITATED');
  expect(text).toContain('NotARashi');
  expect(text).toContain('PURPLE');
  expect(text, 'an impossible angle was normalised').toContain('412\u00B071\u2032');
  expect(text, 'a negative dasha balance was corrected').toContain('-3y 14m 40d');

  // And nothing may be added. The renderer must not annotate, warn or fix.
  expect(text).not.toMatch(/invalid|impossible|corrected|normalis/i);
});

test('BEHAVIOURAL — an empty model produces an empty document, not a default chart', async () => {
  // A renderer that fills in a missing section is deriving the report.
  const empty: KundliReportModelV2 = {
    reportModelVersion: 'kundli-report-v2',
    reportId: 'CT-KUNDLI-EMPTY-PROBE',
    contentHash: '0'.repeat(64),
    fingerprint: '0000000000000000',
    generatedAt: '2026-01-01T00:00:00.000Z',
    locale: 'en',
    labelMode: 'hi-en',
    engineVersions: {},
    subject: { name: 'Probe', birthDate: '1995-06-15', birthTime: '10:30', locationName: 'Nowhere' },
    sections: [{
      id: 'only', title: 'Only', part: 'A', startsNewPage: true, status: 'READY',
      blocks: [{ kind: 'sectionTitle', text: 'Only section' }],
    }],
  };
  const rendered = await renderKundliPdfV3(empty, { creationDate: new Date('2026-01-01T00:00:00.000Z') });
  const inspection = await inspectPdf(rendered.buffer);

  expect(inspection.pageCount).toBe(1);
  expect(inspection.allText).toContain('Only section');
  // No invented content of any kind.
  for (const invented of ['Sun', 'Moon', 'Lagna', 'Nakshatra', 'Mahadasha']) {
    expect(inspection.allText, `the renderer invented ${invented}`).not.toContain(invented);
  }
});

test('BEHAVIOURAL — an incomplete chart model is reported, never approximated', async () => {
  // The temptation is to fill the missing houses in. The contract is to say so.
  const broken: KundliReportModelV2 = {
    reportModelVersion: 'kundli-report-v2',
    reportId: 'CT-KUNDLI-BROKEN-CHART',
    contentHash: '0'.repeat(64),
    fingerprint: '0000000000000000',
    generatedAt: '2026-01-01T00:00:00.000Z',
    locale: 'en',
    labelMode: 'hi-en',
    engineVersions: {},
    subject: { name: 'Probe', birthDate: '1995-06-15', birthTime: '10:30', locationName: 'Nowhere' },
    sections: [{
      id: 'chart', title: 'Chart', part: 'A', startsNewPage: true, status: 'READY',
      blocks: [
        { kind: 'sectionTitle', text: 'Broken chart' },
        { kind: 'chart', chartType: 'NORTH_INDIAN_D1', size: 'hero', caption: 'incomplete', data: { houses: [] } },
      ],
    }],
  };
  const rendered = await renderKundliPdfV3(broken, { creationDate: new Date('2026-01-01T00:00:00.000Z') });
  const text = (await inspectPdf(rendered.buffer)).allText;
  expect(text).toMatch(/Chart not drawn/i);
  expect(text).toMatch(/reported rather than approximated/i);
});
