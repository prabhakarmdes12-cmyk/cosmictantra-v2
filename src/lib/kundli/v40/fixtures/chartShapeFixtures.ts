/**
 * KUNDLI V40.1 — layout stress fixtures (§13).
 *
 * A chart page that lays out correctly for one birth can break for another.
 * The three shapes below are the ones that actually break things, and they are
 * SYNTHETIC on purpose: they are not real births, they compute nothing, and
 * they are never fed to the astrology engines. They exist to prove that the
 * DRAWING survives its extremes.
 *
 *   SPARSE   grahas spread one or two to a house. Tests that a nearly empty
 *            house still shows its sign number and does not collapse.
 *   DENSE    seven grahas in one house, two in another. Tests the font
 *            downscaling path and the label-overlap guarantee.
 *   EDGE     the longest strings the report can contain: a long name, a long
 *            place, bilingual labels everywhere, every graha retrograde, and
 *            every yoga status present at once.
 *
 * Each fixture also carries the surrounding page furniture, because a chart
 * that fits and a chart page that fits are different claims.
 */

import {
  CHART_MODEL_VERSION, PLANET_ABBREVIATIONS, placementEvidenceId, chartDegreeLabel,
  type ChartRenderModel, type ChartPlacement, type PlanetId,
} from '../../chartModel';
import type { KundliReportModelV2, V2Block, V2Section } from '../reportBlocks';

export const CHART_SHAPE_FIXTURE_VERSION = 'chart-shape-fixtures-v1';

export type ChartShape = 'SPARSE' | 'DENSE' | 'EDGE';

/** house number (1..12) -> the grahas standing in it. */
export type Distribution = Partial<Record<number, PlanetId[]>>;

export const DISTRIBUTIONS: Record<ChartShape, Distribution> = {
  // One or two per house, nothing crowded, five houses empty.
  SPARSE: { 1: ['Sun'], 3: ['Moon'], 5: ['Mars'], 7: ['Mercury'], 9: ['Jupiter'], 11: ['Venus', 'Saturn'], 12: ['Rahu'], 6: ['Ketu'] },
  // The worst realistic crowding: a stellium of seven plus a pair.
  DENSE: { 4: ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'], 10: ['Rahu', 'Ketu'] },
  // Every house occupied, four of them by two grahas, nothing empty.
  EDGE: {
    1: ['Sun', 'Ketu'], 2: ['Moon'], 4: ['Mars', 'Saturn'], 6: ['Mercury'],
    7: ['Jupiter', 'Rahu'], 10: ['Venus'],
  },
};

const LAGNA_SIGN: Record<ChartShape, number> = { SPARSE: 5, DENSE: 12, EDGE: 8 };

function buildChart(shape: ChartShape, division: 1 | 9, labelMode: 'EN' | 'HI' | 'BILINGUAL'): ChartRenderModel {
  const lagnaSign = LAGNA_SIGN[shape];
  const houses = Array.from({ length: 12 }, (_, i) => ({
    houseNumber: i + 1,
    signNumber: ((lagnaSign - 1 + i) % 12) + 1,
    evidenceId: placementEvidenceId(division, i + 1),
  }));

  const placements: ChartPlacement[] = [];
  const dist = DISTRIBUTIONS[shape];
  for (const house of houses) {
    // An empty house gets NO placement. The chart model represents emptiness
    // by the absence of a graha, and inventing a placeholder placement here
    // would make the fixture exercise a shape the real pipeline never emits.
    const occupants = dist[house.houseNumber] ?? [];
    for (const planetId of occupants) {
      const abbr = PLANET_ABBREVIATIONS[planetId];
      placements.push({
        division,
        houseNumber: house.houseNumber,
        signNumber: house.signNumber,
        planetId,
        displayName: labelMode === 'HI' ? abbr.full.hi : abbr.full.en,
        abbreviation: labelMode === 'HI' ? abbr.hi : abbr.en,
        displayLabel: `${labelMode === 'HI' ? abbr.hi : abbr.en} ${chartDegreeLabel(12.5, labelMode)}`,
        // Every graha retrograde in the EDGE case: the marker is a drawn rule
        // under the abbreviation, and nine of them at once is the stress case.
        retrograde: shape === 'EDGE' || planetId === 'Rahu' || planetId === 'Ketu',
        degreeInSign: 12.5,
        sourcePath: `fixture.${shape}.planets[${planetId}]`,
        evidenceId: placementEvidenceId(division, house.houseNumber, planetId),
      });
    }
  }

  return {
    chartModelVersion: CHART_MODEL_VERSION,
    division,
    chartName: division === 1 ? 'Rashi (D1)' : 'Navamsha (D9)',
    chartNameHi: division === 1 ? 'जन्म कुण्डली (D1)' : 'नवांश (D9)',
    chartSystem: 'NORTH_INDIAN',
    labelMode,
    devanagariNumerals: labelMode === 'HI',
    lagnaSignNumber: lagnaSign,
    lagnaEvidenceId: placementEvidenceId(division, 1),
    houses,
    placements,
    textual: houses.map((h) => {
      const occ = (dist[h.houseNumber] ?? []).join(', ');
      return `House ${h.houseNumber} (sign ${h.signNumber}): ${occ || 'empty'}`;
    }),
    placementHash: `fixture-${shape}-d${division}`,
  };
}

export function chartShapeModel(shape: ChartShape, division: 1 | 9 = 1, labelMode: 'EN' | 'HI' | 'BILINGUAL' = 'EN'): ChartRenderModel {
  return buildChart(shape, division, labelMode);
}

/* ------------------------------------------------------------------ */

export const LONG_NAME = 'Lakshmi Venkataramanujacharya Subrahmanya Iyer-Nambiar';
export const LONG_PLACE = 'Thiruvananthapuram, Kerala, India (formerly Trivandrum)';

function shapeSection(shape: ChartShape): V2Section {
  const bilingual = shape === 'EDGE';
  const chart = buildChart(shape, 1, bilingual ? 'BILINGUAL' : 'EN');
  const dist = DISTRIBUTIONS[shape];

  const rows = Array.from({ length: 12 }, (_, i) => {
    const h = i + 1;
    const occupants = dist[h] ?? [];
    const names = occupants.map((p) => {
      const abbr = PLANET_ABBREVIATIONS[p];
      const base = bilingual ? `${abbr.full.en} / ${abbr.full.hi}` : abbr.full.en;
      return shape === 'EDGE' ? `${base} (R)` : base;
    });
    return [String(h), `Sign ${chart.houses[i].signNumber}`, names.join(', ') || '—'];
  });

  const blocks: V2Block[] = [
    {
      kind: 'sectionTitle',
      text: `Layout stress — ${shape.toLowerCase()} distribution`,
      secondary: bilingual ? 'जन्म कुण्डली — विषम स्थिति परीक्षण' : undefined,
      tag: `FIXTURE ${shape}`,
    },
    {
      kind: 'paragraph', size: 'small',
      text: shape === 'SPARSE'
        ? 'One or two grahas per house and five empty houses. An empty house must still carry its sign number and must not collapse.'
        : shape === 'DENSE'
          ? 'Seven grahas in one house and two in another. The chart module reduces the label size until the labels fit; below its floor it stops, and the placement table beneath is the guarantee.'
          : 'Every graha retrograde, bilingual labels, the longest name and place the report allows, and every yoga status present at once.',
    },
    {
      kind: 'chart',
      chartType: 'NORTH_INDIAN_D1',
      data: chart,
      size: 'hero',
      caption: bilingual
        ? 'उत्तर भारतीय शैली — North Indian format. House 1 is the top diamond; a rule beneath an abbreviation marks retrograde motion.'
        : 'North Indian format. House 1 is the top diamond; a rule beneath an abbreviation marks retrograde motion.',
      sideFacts: [
        { label: 'Lagna', value: `Sign ${chart.lagnaSignNumber}` },
        { label: 'Occupied houses', value: String(Object.keys(dist).length) },
      ],
    },
    {
      kind: 'table',
      headers: ['Bhava', 'Rashi', 'Grahas', 'Bhava', 'Rashi', 'Grahas'],
      widths: [0.085, 0.145, 0.27, 0.085, 0.145, 0.27],
      align: ['right', 'left', 'left', 'right', 'left', 'left'],
      rows: rows.slice(0, 6).map((row, i) => [...row, ...rows[i + 6]]),
      caption: 'Every placement in the drawing, as text.',
    },
  ];

  if (shape === 'EDGE') {
    blocks.push({
      kind: 'kvGrid', columns: 2,
      items: [
        { label: 'Name', value: LONG_NAME },
        { label: 'Birthplace', value: LONG_PLACE },
        { label: 'सिंह लग्न · Leo Ascendant', value: '29°59′59″ — the last arc-second of the sign' },
        { label: 'उत्तराषाढ़ा · Uttara Ashadha', value: 'पद 4 · pada 4' },
      ],
    });
    blocks.push({
      kind: 'statusList',
      title: 'Every status at once',
      items: [
        { label: 'Gaja-Kesari Yoga', status: 'PRESENT', note: 'present', xref: 'SEE APPENDIX Y-01' },
        { label: 'Budhaditya Yoga', status: 'ABSENT', note: 'absent', xref: 'SEE APPENDIX Y-02' },
        { label: 'Dharma-Karmadhipati Yoga — mutual-kendra variant (not adopted)', status: 'SCHOLAR_JUDGEMENT', note: 'tradition-dependent; no verdict is issued', xref: 'SEE APPENDIX Y-05' },
        { label: 'Shadbala', status: 'VALIDATION_PENDING', note: 'validation pending', xref: 'SEE APPENDIX B7' },
        { label: 'Kalsarpa', status: 'NOT_CALCULATED', note: 'not calculated', xref: 'SEE APPENDIX D-03' },
        { label: 'Kemadruma Yoga', status: 'INDETERMINATE', note: 'indeterminate', xref: 'SEE APPENDIX Y-11' },
      ],
    });
  }

  return { id: `stress-${shape.toLowerCase()}`, title: `Layout stress — ${shape}`, part: 'A', startsNewPage: true, status: 'READY', blocks };
}

/** A single document containing all three shapes, one page each. */
export function buildChartShapeFixture(): KundliReportModelV2 {
  return {
    reportModelVersion: CHART_SHAPE_FIXTURE_VERSION,
    reportId: 'CT-CHART-SHAPE-FIXTURE',
    generatedAt: '1970-01-01T00:00:00.000Z',
    locale: 'en',
    labelMode: 'hi-en',
    contentHash: 'chart-shape-fixture',
    fingerprint: 'chart-shape-fixture',
    engineVersions: { renderer: 'kundli-pdf-renderer-v3' },
    subject: {
      name: LONG_NAME,
      birthDate: '1970-01-01',
      birthTime: '00:00',
      locationName: LONG_PLACE,
    },
    sections: (['SPARSE', 'DENSE', 'EDGE'] as ChartShape[]).map(shapeSection),
  };
}

