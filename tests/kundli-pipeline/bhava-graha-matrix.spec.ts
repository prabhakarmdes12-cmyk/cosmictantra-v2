/**
 * BHAVA–GRAHA MATRIX
 *
 * A grid of which graha occupies which house. It reads at a glance in a way
 * a table of rows does not, which is also what makes it dangerous: a wrong
 * mark looks exactly like a right one. So the matrix is held to the same
 * placements the chart is held to, and the tests assert agreement rather
 * than mere presence.
 *
 * Nothing in the matrix is calculated by it. Occupancy comes from the
 * canonical model, lordship from the SIGN_LORDS table the gate already
 * validates, and abbreviations from the chart registry.
 */
import { test, expect } from '@playwright/test';
import { buildCanonicalModel } from '../../src/lib/kundli/canonicalModel';
import { buildKundliReport } from '../../src/lib/kundli/reportModel';
import { getCanonicalJyotishSnapshot } from '../../src/lib/jyotish/canonicalSnapshot';
import { PLANET_ABBREVIATIONS, PLANET_IDS } from '../../src/lib/kundli/chartModel';
import { SIGN_LORDS } from '../../src/lib/jyotish/yogaEngine';

const CONFIG: any = {
  ayanamsha: 'LAHIRI_CHITRA_PAKSHA', ayanamshaName: 'Lahiri (Chitra Paksha)',
  houseSystem: 'EQUAL_SIGN', nodeMode: 'MEAN_NODE', ephemerisProvider: 'fixture',
  engineVersion: 'V36.0', calculationVersion: 'fixture', reportVersion: 'fixture',
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

function model() {
  const snapshot = getCanonicalJyotishSnapshot({
    birthDate: '1995-06-15', birthTime: '10:30',
    latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna',
  });
  return buildCanonicalModel({ profile: PROFILE, snapshot, config: CONFIG }) as any;
}

function matrix(locale: 'en' | 'hi' = 'en') {
  const report = buildKundliReport(model(), { locale });
  const section: any = report.sections.find((s) => s.id === 'bhava-graha-matrix');
  return { section, table: section.blocks.find((b: any) => b.kind === 'table') };
}

const OCCUPIED = '\u2022';

/**
 * U+25CF (●) is NOT encoded in the PDF's built-in font and emerges as '%Ï'.
 * U+2022 (•) is, and is already used elsewhere in this report. This test
 * exists because the wrong glyph looked fine in TypeScript, in the SVG and in
 * a passing test, and only failed once the PDF was read back.
 */
const GLYPHS_THE_PDF_FONT_CANNOT_ENCODE = ['\u25CF', '\u25A0', '\u25C6'];

test.describe('BHAVA–GRAHA MATRIX — agreement with the canonical model', () => {
  test('the section exists and carries a table', () => {
    const { section, table } = matrix();
    expect(section).toBeTruthy();
    expect(section.status).toBe('READY');
    expect(table).toBeTruthy();
  });

  test('there is one row per house, in order', () => {
    const { table } = matrix();
    expect(table.rows.map((r: string[]) => r[0])).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
  });

  test('there is one column per graha, plus house, sign and lord', () => {
    const { table } = matrix();
    expect(table.headers.slice(0, 3)).toEqual(['H', 'Sign', 'Lord']);
    expect(table.headers.slice(3)).toEqual(PLANET_IDS.map((id) => PLANET_ABBREVIATIONS[id].en));
  });

  test('every graha is marked in exactly one house — the house the model gives it', () => {
    const { table } = matrix();
    const m = model();
    for (const planet of m.planets) {
      const col = 3 + PLANET_IDS.indexOf(planet.id);
      const marked = table.rows.filter((r: string[]) => r[col].startsWith(OCCUPIED));
      expect(marked.length, `${planet.id} marked in ${marked.length} houses`).toBe(1);
      expect(marked[0][0], `${planet.id} marked in the wrong house`).toBe(String(planet.house));
    }
  });

  test('the number of marks equals the number of grahas', () => {
    const { table } = matrix();
    const marks = table.rows.reduce(
      (n: number, r: string[]) => n + r.slice(3).filter((c) => c.startsWith(OCCUPIED)).length, 0);
    expect(marks).toBe(9);
  });

  test('a house the model leaves empty carries no marks', () => {
    const { table } = matrix();
    const m = model();
    for (const house of m.houses) {
      if (house.planets.length > 0) continue;
      const row = table.rows[house.number - 1];
      const marks = row.slice(3).filter((c: string) => c.startsWith(OCCUPIED));
      expect(marks, `house ${house.number} is empty but is marked`).toEqual([]);
    }
  });

  test('retrograde is marked, and only where the model says retrograde', () => {
    const { table } = matrix();
    const m = model();
    for (const planet of m.planets) {
      const col = 3 + PLANET_IDS.indexOf(planet.id);
      const cell = table.rows[planet.house - 1][col];
      expect(cell.includes('R'), `${planet.id} retrograde=${planet.retrograde} but cell reads '${cell}'`)
        .toBe(planet.retrograde);
    }
  });

  test('the lord column agrees with the sign-lord table the gate already validates', () => {
    const { table } = matrix();
    const m = model();
    for (const house of m.houses) {
      const expected = PLANET_ABBREVIATIONS[SIGN_LORDS[house.sign.id] as keyof typeof PLANET_ABBREVIATIONS].en;
      expect(table.rows[house.number - 1][2], `house ${house.number} lord`).toBe(expected);
    }
  });

  test('the sign column agrees with the canonical house signs', () => {
    const { table } = matrix();
    const m = model();
    for (const house of m.houses) {
      expect(table.rows[house.number - 1][1]).toBe(house.sign.en);
    }
  });

  test('the matrix agrees with the D1 chart placements', () => {
    const { table } = matrix();
    const m = model();
    for (const planet of m.planets) {
      const col = 3 + PLANET_IDS.indexOf(planet.id);
      const row = table.rows[planet.house - 1];
      expect(row[col].startsWith(OCCUPIED),
        `${planet.id}: chart says house ${planet.house}, matrix row ${planet.house} reads '${row[col]}'`).toBe(true);
    }
  });
});

test.describe('BHAVA–GRAHA MATRIX — bilingual', () => {
  test('the Hindi matrix places the grahas exactly as the English one does', () => {
    const en = matrix('en').table;
    const hi = matrix('hi').table;
    for (let r = 0; r < 12; r++) {
      // Columns 3..12 are the graha marks; they must be identical regardless
      // of the language the headers are written in.
      expect(hi.rows[r].slice(3)).toEqual(en.rows[r].slice(3));
    }
  });

  test('the Hindi headers use the Devanagari abbreviations from the registry', () => {
    const { table } = matrix('hi');
    expect(table.headers.slice(3)).toEqual(PLANET_IDS.map((id) => PLANET_ABBREVIATIONS[id].hi));
  });

  test('the Hindi sign column is Devanagari, not transliteration', () => {
    const { table } = matrix('hi');
    const devanagari = /[\u0900-\u097F]/;
    for (const row of table.rows) {
      expect(row[1], `sign '${row[1]}' is not Devanagari`).toMatch(devanagari);
    }
  });
});

test.describe('BHAVA–GRAHA MATRIX — a legend a reader can decode', () => {
  test('the occupied, retrograde and empty marks are all explained in text', () => {
    const { section } = matrix();
    const text = section.blocks.filter((b: any) => b.kind === 'paragraph').map((b: any) => b.text).join(' ');
    expect(text).toContain(OCCUPIED);
    expect(text).toContain('R');
    expect(text).toContain('—');
    expect(text.toLowerCase()).toMatch(/empty|retrograde/);
  });

  test('every column abbreviation is expanded somewhere in the section', () => {
    const { section } = matrix();
    const text = section.blocks.filter((b: any) => b.kind === 'paragraph').map((b: any) => b.text).join(' ');
    for (const id of PLANET_IDS) expect(text, `${id} is never expanded`).toContain(id);
  });

  test('the marker is a glyph the PDF font can actually encode', () => {
    const { table } = matrix();
    const cells = table.rows.flatMap((r: string[]) => r.slice(3));
    for (const bad of GLYPHS_THE_PDF_FONT_CANNOT_ENCODE) {
      expect(cells.join(''), `the marker U+${bad.codePointAt(0)!.toString(16)} is not encoded in the PDF font`).not.toContain(bad);
    }
    expect(cells.join('')).toContain(OCCUPIED);
  });

  test('the section states that it is placement, not interpretation', () => {
    const { section } = matrix();
    const text = section.blocks.filter((b: any) => b.kind === 'paragraph').map((b: any) => b.text).join(' ').toLowerCase();
    expect(text).toMatch(/not interpretation|calculated placement/);
  });
});
