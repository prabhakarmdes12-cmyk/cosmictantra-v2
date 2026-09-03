#!/usr/bin/env node
/**
 * VARGA BOUNDARY FIXTURE BUILDER — Sprint D (D1/D9/D10 + Varga certification).
 *
 * Encodes the sixteen classical Parashari divisional schemes (BPHS Shodashavarga
 * chapter) as LITERAL REFERENCE TABLES — data, not code — and emits
 * qualification/fixtures/varga-boundary-fixtures.json with:
 *   rows            : one per (division, rashi, part) -> expected varga rashi index
 *   boundaryProbes  : ±1e-6° probes at every interior part boundary (absolute longitudes)
 *   anchors         : hand-checked classical statements (e.g. navamsa scheme of Aries)
 *
 * The tables below are written from the classical rule statements:
 *   D1  Rashi          : the sign itself.
 *   D2  Hora           : odd signs 0-15° Simha(4), 15-30° Karka(3); even signs reversed.
 *   D3  Drekkana       : parts of 10° -> the sign itself, the 5th, the 9th (offsets 0,4,8).
 *   D4  Chaturthamsha  : parts of 7.5° -> itself, 4th, 7th, 10th (offsets 0,3,6,9).
 *   D7  Saptamsha      : odd signs count from themselves; even signs from the 7th from it.
 *   D9  Navamsha       : movable signs count from themselves; fixed from the 9th; dual from
 *                        the 5th. Equivalent element starts: Fi->Mesha(0), Ea->Makara(9),
 *                        Ai->Tula(6), Wa->Karka(3). (This is the rule VARGA_CONVENTION
 *                        declares; the D16-style mobility starts are NOT the D9 rule.)
 *   D10 Dashamsha      : odd signs from themselves; even signs from the 9th from it.
 *   D12 Dwadashamsha   : from the sign itself, consecutive.
 *   D16 Shodashamsha   : movable -> Mesha(0); fixed -> Simha(4); dual -> Dhanu(8).
 *   D20 Vimshamsha     : movable -> Mesha(0); fixed -> Dhanu(8); dual -> Simha(4).
 *   D24 Chaturvimshamsha: odd -> Simha(4); even -> Karka(3).
 *   D27 Saptavimshamsha: Fi -> Mesha(0); Ea -> Karka(3); Ai -> Tula(6); Wa -> Makara(9).
 *   D30 Trimshamsha    : odd  [0,5)Mesha(0) [5,10)Kumbha(10) [10,18)Dhanu(8) [18,25)Mithuna(2) [25,30)Tula(6)
 *                        even [0,5)Vrishabha(1) [5,12)Kanya(5) [12,20)Meena(11) [20,25)Makara(9) [25,30)Vrishchika(7)
 *   D40 Khavedamsha    : odd -> Mesha(0); even -> Tula(6).
 *   D45 Akshavedamsha  : movable -> Mesha(0); fixed -> Simha(4); dual -> Dhanu(8).
 *   D60 Shashtiamsha   : from the sign itself, consecutive (60 parts of 0.5°).
 *
 * Source status: SOURCE_SECONDARY (classical text as received through standard
 * translations; no verse-level locator is claimed). The emitted JSON is committed;
 * its setSha256 pins the exact reference. Never regenerate silently (CT_INV_008).
 *
 * Usage: node qualification/tools/build-varga-fixtures.cjs
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FIXTURE_SET_ID = 'VARGA_BOUNDARY_BPHS_001';
const BUILDER_VERSION = 'build-varga-fixtures-1.0.0';
const EPS = 1e-6;

const seq = (n) => Array.from({ length: n }, (_, i) => i);

// ---------------------------------------------------------------------------
// Literal reference tables. Division -> 12 entries (rashi 0..11), each entry
// lists the expected varga rashi index (0..11) of EVERY part in that rashi.
// Uniform consecutive schemes are written as literal start arrays + seq(N);
// D3/D4 use explicit offset literals (they skip signs); D2/D30 are span-based.
// ---------------------------------------------------------------------------
const CONSECUTIVE = {
  1:  { parts: 1,  starts: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  7:  { parts: 7,  starts: [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5] },
  9:  { parts: 9,  starts: [0, 9, 6, 3, 0, 9, 6, 3, 0, 9, 6, 3] },
  10: { parts: 10, starts: [0, 9, 2, 11, 4, 1, 6, 3, 8, 5, 10, 7] },
  12: { parts: 12, starts: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  16: { parts: 16, starts: [0, 4, 8, 0, 4, 8, 0, 4, 8, 0, 4, 8] },
  20: { parts: 20, starts: [0, 8, 4, 0, 8, 4, 0, 8, 4, 0, 8, 4] },
  24: { parts: 24, starts: [4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3] },
  27: { parts: 27, starts: [0, 3, 6, 9, 0, 3, 6, 9, 0, 3, 6, 9] },
  40: { parts: 40, starts: [0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6] },
  45: { parts: 45, starts: [0, 4, 8, 0, 4, 8, 0, 4, 8, 0, 4, 8] },
  60: { parts: 60, starts: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }
};

const SKIP_OFFSET = {
  3: { parts: 3, offsets: [0, 4, 8] },  // itself, 5th, 9th
  4: { parts: 4, offsets: [0, 3, 6, 9] } // itself, 4th, 7th, 10th
};

const SPAN = {
  2: {
    parts: 2,
    odd: [{ end: 15, sign: 4 }, { end: 30, sign: 3 }],
    even: [{ end: 15, sign: 3 }, { end: 30, sign: 4 }]
  },
  30: {
    parts: 5,
    odd: [{ end: 5, sign: 0 }, { end: 10, sign: 10 }, { end: 18, sign: 8 }, { end: 25, sign: 2 }, { end: 30, sign: 6 }],
    even: [{ end: 5, sign: 1 }, { end: 12, sign: 5 }, { end: 20, sign: 11 }, { end: 25, sign: 9 }, { end: 30, sign: 7 }]
  }
};

const DIVISIONS = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60];

function tableFor(division) {
  // returns [12][N] expected varga rashi indices
  const table = [];
  if (CONSECUTIVE[division]) {
    const { parts, starts } = CONSECUTIVE[division];
    for (let s = 0; s < 12; s++) table.push(seq(parts).map((i) => (starts[s] + i) % 12));
    return table;
  }
  if (SKIP_OFFSET[division]) {
    const { parts, offsets } = SKIP_OFFSET[division];
    for (let s = 0; s < 12; s++) table.push(seq(parts).map((i) => (s + offsets[i]) % 12));
    return table;
  }
  if (SPAN[division]) {
    const spec = SPAN[division];
    for (let s = 0; s < 12; s++) {
      const spans = s % 2 === 0 ? spec.odd : spec.even;
      table.push(spans.map((sp) => sp.sign));
    }
    return table;
  }
  throw new Error(`No classical table for division D${division}`);
}

// Hand-checked classical anchors (absolute longitude degrees, division, expected index).
const ANCHORS = [
  { division: 9, lon: 0.0, expected: 0, note: 'Navamsa of Mesha 0° is Mesha (movable counts from itself).' },
  { division: 9, lon: 3.3333333333, expected: -1, note: 'EXACT 3°20′ is a knife edge — excluded; probes cover both sides in boundaryProbes.' },
  { division: 9, lon: 3.4, expected: 1, note: 'Mesha just past 3°20′ is in the 2nd navamsha, Vrishabha — classical navamsa scheme.' },
  { division: 9, lon: 3.3, expected: 0, note: 'Mesha just before 3°20′ is still the 1st navamsha, Mesha.' },
  { division: 9, lon: 30.0, expected: 9, note: 'Vrishabha 0° (fixed) counts from the 9th from it: Makara.' },
  { division: 9, lon: 60.0, expected: 6, note: 'Mithuna 0° (dual) counts from the 5th from it: Tula.' },
  { division: 9, lon: 90.0, expected: 3, note: 'Karka 0° (movable) counts from itself: Karka.' },
  { division: 9, lon: 359.9999999, expected: 11, note: 'Meena last navamsha: base Karka(3) + 8 parts = Dhanu(11).' },
  { division: 10, lon: 0.0, expected: 0, note: 'Dashamsha of an odd sign counts from the sign itself.' },
  { division: 10, lon: 30.0, expected: 9, note: 'Dashamsha of an even sign counts from the 9th from it (Vrishabha -> Dhanu).' },
  { division: 3, lon: 10.0, expected: 4, note: '2nd drekkana is the 5th sign (Mesha 10° -> Simha).' },
  { division: 3, lon: 20.0, expected: 8, note: '3rd drekkana is the 9th sign (Mesha 20° -> Dhanu).' },
  { division: 30, lon: 2.5, expected: 0, note: 'Trimshamsha odd 0-5° Mesha (Mars).' },
  { division: 30, lon: 7.5, expected: 10, note: 'Trimshamsha odd 5-10° Kumbha (Saturn).' },
  { division: 30, lon: 14.0, expected: 8, note: 'Trimshamsha odd 10-18° Dhanu (Jupiter).' },
  { division: 30, lon: 21.0, expected: 2, note: 'Trimshamsha odd 18-25° Mithuna (Mercury).' },
  { division: 30, lon: 27.0, expected: 6, note: 'Trimshamsha odd 25-30° Tula (Venus).' },
  { division: 30, lon: 32.5, expected: 1, note: 'Trimshamsha even 0-5° Vrishabha (Venus).' },
  { division: 30, lon: 38.0, expected: 5, note: 'Trimshamsha even 5-12° Kanya (Mercury).' },
  { division: 30, lon: 45.0, expected: 11, note: 'Trimshamsha even 12-20° Meena (Jupiter).' },
  { division: 30, lon: 52.5, expected: 9, note: 'Trimshamsha even 20-25° Makara (Saturn).' },
  { division: 30, lon: 57.0, expected: 7, note: 'Trimshamsha even 25-30° Vrishchika (Mars).' },
  { division: 2, lon: 7.5, expected: 4, note: 'Hora of an odd sign 0-15° is Simha (Sun).' },
  { division: 2, lon: 22.5, expected: 3, note: 'Hora of an odd sign 15-30° is Karka (Moon).' },
  { division: 2, lon: 37.5, expected: 3, note: 'Hora of an even sign 0-15° is Karka (Moon).' },
  { division: 2, lon: 52.5, expected: 4, note: 'Hora of an even sign 15-30° is Simha (Sun).' },
  { division: 60, lon: 0.0, expected: 0, note: 'Shashtiamsha of Mesha 0° is Mesha (counts from itself).' },
  { division: 60, lon: 0.499999, expected: 0, note: 'Mesha 0°29′59″ still in the 1st shashtiamsha.' },
  { division: 60, lon: 0.500001, expected: 1, note: 'Crossing 0°30′ flips the shashtiamsha (RSK_004 sensitivity boundary).' }
];

function spanFor(sign, degInSign, division) {
  const spec = SPAN[division];
  const spans = sign % 2 === 0 ? spec.odd : spec.even;
  for (let i = 0; i < spans.length; i++) {
    if (degInSign < spans[i].end) return { part: i, signIndex: spans[i].sign, end: spans[i].end };
  }
  return { part: spans.length - 1, signIndex: spans[spans.length - 1].sign, end: 30 };
}

// ---------------------------------------------------------------------------
// Emit rows + boundary probes.
// ---------------------------------------------------------------------------
const tables = {};
const rows = [];
const boundaryProbes = [];

for (const d of DIVISIONS) {
  tables[d] = tableFor(d);
  for (let s = 0; s < 12; s++) {
    const row = tables[d][s];
    for (let p = 0; p < row.length; p++) {
      rows.push({ division: d, sign: s, part: p, expectedSignIndex: row[p] });
    }
    // interior boundaries (within the sign)
    if (SPAN[d]) {
      const spec = SPAN[d];
      const spans = s % 2 === 0 ? spec.odd : spec.even;
      for (let b = 0; b < spans.length - 1; b++) {
        const abs = s * 30 + spans[b].end;
        boundaryProbes.push({ division: d, lon: abs - EPS, expectedSignIndex: spans[b].sign });
        boundaryProbes.push({ division: d, lon: abs + EPS, expectedSignIndex: spans[b + 1].sign });
      }
    } else {
      const n = row.length;
      for (let b = 1; b < n; b++) {
        const abs = s * 30 + (b * 30) / n;
        boundaryProbes.push({ division: d, lon: abs - EPS, expectedSignIndex: row[b - 1] });
        boundaryProbes.push({ division: d, lon: abs + EPS, expectedSignIndex: row[b] });
      }
    }
  }
}

// zodiac-wrap probes: last part of Meena vs first part of Mesha, every division
for (const d of DIVISIONS) {
  const last = tables[d][11][tables[d][11].length - 1];
  const first = tables[d][0][0];
  boundaryProbes.push({ division: d, lon: 360 - EPS, expectedSignIndex: last });
  boundaryProbes.push({ division: d, lon: EPS, expectedSignIndex: first });
}

const anchors = ANCHORS.filter((a) => a.expected >= 0);

const payload = {
  fixtureSetId: FIXTURE_SET_ID,
  generator: BUILDER_VERSION,
  createdAtUtc: new Date().toISOString(),
  source: {
    statement: 'Brihat Parashara Hora Shastra, Shodashavarga chapter — sixteen classical Parashari divisional schemes',
    status: 'SOURCE_SECONDARY'
  },
  divisions: DIVISIONS.map((d) => ({
    division: d,
    kind: SPAN[d] ? 'span' : 'uniform',
    parts: SPAN[d] ? SPAN[d].parts : CONSECUTIVE[d] ? CONSECUTIVE[d].parts : SKIP_OFFSET[d].parts,
    table: tables[d]
  })),
  rowCount: rows.length,
  boundaryProbeCount: boundaryProbes.length,
  setSha256: crypto.createHash('sha256').update(JSON.stringify({ rows, boundaryProbes, anchors })).digest('hex')
};

const out = { ...payload, rows, boundaryProbes, anchors };
const dest = path.join(__dirname, '..', 'fixtures', 'varga-boundary-fixtures.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 1));
console.log(`varga fixtures: ${rows.length} rows, ${boundaryProbes.length} probes, ${anchors.length} anchors`);
console.log(`setSha256 ${payload.setSha256}`);
console.log(`written ${dest}`);
