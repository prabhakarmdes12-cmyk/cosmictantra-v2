/**
 * REPORT SCHEMA CONFORMANCE
 *
 * docs/scholar-kundli/REPORT-SCHEMA-v1.md describes what a delivered report
 * is. These tests parse that document and hold the code to it, so the
 * document cannot drift: add a section to the report and this fails until §2
 * of the document is updated too.
 *
 * Counts are not asserted. A chart with a different number of yogas
 * legitimately produces a different number of tables in major-yogas. The set
 * of block kinds each section may contain is asserted, because that is a
 * statement about the schema rather than about one chart.
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { buildCanonicalModel } from '../../src/lib/kundli/canonicalModel';
import { buildKundliReport, REPORT_MODEL_VERSION } from '../../src/lib/kundli/reportModel';
import { getCanonicalJyotishSnapshot } from '../../src/lib/jyotish/canonicalSnapshot';
import { MANDATORY_REPORT_SECTIONS } from '../../src/lib/kundli/validation';

const CONFIG: any = {
  ayanamsha: 'LAHIRI_CHITRA_PAKSHA',
  ayanamshaName: 'Lahiri (Chitra Paksha)',
  houseSystem: 'EQUAL_SIGN',
  nodeMode: 'MEAN_NODE',
  ephemerisProvider: 'fixture',
  engineVersion: 'V36.0',
  calculationVersion: 'fixture',
  reportVersion: 'fixture',
};

const PROFILE: any = {
  name: 'Priya Sharma', birthDate: '1995-06-15', birthTime: '10:30', locationName: 'Patna',
  coordinates: { latitude: 25.5941, longitude: 85.1376, provenance: 'MANUAL' },
  timezone: {
    timezoneId: 'Asia/Kolkata', utcOffsetAtBirth: 5.5,
    localDateTime: '1995-06-15T10:30:00', utcDateTime: '1995-06-15T05:00:00.000Z',
    offsetProvenance: 'IANA_HISTORICAL',
  },
  fingerprint: 'fixture',
};

function referenceReport() {
  const snapshot = getCanonicalJyotishSnapshot({
    birthDate: '1995-06-15', birthTime: '10:30',
    latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna',
  });
  const canonical = buildCanonicalModel({ profile: PROFILE, snapshot, config: CONFIG }) as any;
  return buildKundliReport(canonical, { locale: 'en' });
}

/** Parse the section table out of §2 of the schema document. */
function documentedSchema(): { index: number; id: string; kinds: string[] }[] {
  const doc = fs.readFileSync(
    path.join(process.cwd(), 'docs', 'scholar-kundli', 'REPORT-SCHEMA-v1.md'), 'utf8',
  );
  const rows = doc.split('\n').filter((l) => /^\| \d+ \| `/.test(l));
  return rows.map((line) => {
    const cells = line.split('|').map((c) => c.trim());
    const id = cells[2].replace(/`/g, '');
    const kinds = [...cells[5].matchAll(/([a-zA-Z]+) ×\d+/g)].map((m) => m[1]);
    return { index: Number(cells[1]), id, kinds: [...new Set(kinds)] };
  });
}

const ALLOWED_KINDS = new Set([
  'heading', 'paragraph', 'keyValue', 'table', 'chart', 'callout', 'divider', 'pageFooter',
]);

test.describe('REPORT SCHEMA — the document and the code agree', () => {
  test('the document lists at least one section, so a parsing bug cannot pass vacuously', () => {
    expect(documentedSchema().length).toBeGreaterThan(25);
  });

  test('INV-S1 — the report section order is exactly the documented order', () => {
    const actual = referenceReport().sections.map((s) => s.id);
    const documented = documentedSchema().map((r) => r.id);
    expect(actual).toEqual(documented);
  });

  test('INV-S2 — section ids are unique', () => {
    const ids = referenceReport().sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('INV-S3 — every block kind is one of the eight the schema allows', () => {
    for (const section of referenceReport().sections) {
      for (const block of section.blocks) {
        expect(ALLOWED_KINDS, `${section.id} contains kind '${(block as any).kind}'`).toContain((block as any).kind);
      }
    }
  });

  test('the block kinds each section contains are exactly the kinds the document lists', () => {
    const byId = new Map(referenceReport().sections.map((s) => [s.id, s]));
    for (const row of documentedSchema()) {
      const section = byId.get(row.id);
      expect(section, `document names section '${row.id}' which the report does not contain`).toBeTruthy();
      const actualKinds = [...new Set(section!.blocks.map((b: any) => b.kind))].sort();
      expect(actualKinds, `kind mismatch in ${row.id}`).toEqual([...row.kinds].sort());
    }
  });

  test('INV-S4 — every mandatory section exists, is READY and is non-empty', () => {
    const byId = new Map(referenceReport().sections.map((s) => [s.id, s]));
    for (const id of MANDATORY_REPORT_SECTIONS) {
      const section = byId.get(id);
      expect(section, `mandatory section ${id} missing`).toBeTruthy();
      expect(section!.status).toBe('READY');
      expect(section!.blocks.length).toBeGreaterThan(0);
    }
  });

  test('INV-S5 — each chart is immediately followed by its textual equivalent', () => {
    const ids = referenceReport().sections.map((s) => s.id);
    expect(ids[ids.indexOf('d1-chart') + 1]).toBe('d1-placement-table');
    expect(ids[ids.indexOf('d9-chart') + 1]).toBe('d9-placement-table');
  });

  test('INV-S7 — only the disclaimer follows the certificate', () => {
    const ids = referenceReport().sections.map((s) => s.id);
    const at = ids.indexOf('calculation-certificate');
    expect(at).toBeGreaterThan(-1);
    expect(ids.slice(at + 1)).toEqual(['disclaimer']);
  });

  test('the schema version the document names is the one the code exports', () => {
    const doc = fs.readFileSync(
      path.join(process.cwd(), 'docs', 'scholar-kundli', 'REPORT-SCHEMA-v1.md'), 'utf8',
    );
    const claimed = /Schema version: `([^`]+)`/.exec(doc)?.[1];
    expect(claimed).toBe(REPORT_MODEL_VERSION);
  });
});

test.describe('REPORT SCHEMA — evidence ids are well formed', () => {
  const evidenceIdsIn = (report: ReturnType<typeof referenceReport>): string[] => {
    const out = new Set<string>();
    const walk = (value: unknown) => {
      if (typeof value === 'string') {
        for (const m of value.matchAll(/\b(FACT|CHART-D1|CHART-D9|DASHA|YOGA|DOSHA|SOURCE)-[A-Za-z0-9_\-]+/g)) {
          out.add(m[0]);
        }
      } else if (Array.isArray(value)) {
        value.forEach(walk);
      } else if (value && typeof value === 'object') {
        Object.values(value).forEach(walk);
      }
    };
    walk(JSON.parse(JSON.stringify(report)));
    return [...out];
  };

  test('INV-S6 — no evidence id contains a database id, a path or a personal name', () => {
    const ids = evidenceIdsIn(referenceReport());
    expect(ids.length).toBeGreaterThan(10);
    for (const id of ids) {
      // 24 hex chars is the shape of a Mongo/ObjectId primary key.
      expect(id, `${id} looks like a raw database id`).not.toMatch(/[0-9a-f]{24}/i);
      expect(id).not.toMatch(/[\/\\]/);
      expect(id).not.toMatch(/priya|sharma|patna/i);
    }
  });

  test('the same report built twice produces identical evidence ids', () => {
    expect(evidenceIdsIn(referenceReport()).sort()).toEqual(evidenceIdsIn(referenceReport()).sort());
  });
});
