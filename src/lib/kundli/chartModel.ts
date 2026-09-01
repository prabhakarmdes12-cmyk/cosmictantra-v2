/**
 * CANONICAL CHART-RENDERING MODEL
 *
 * One typed contract between the canonical model and every chart surface
 * (PDF vector, SVG, textual equivalent). The renderer is NOT allowed to
 * calculate anything: it draws placements that already exist in the canonical
 * model, and this module refuses to produce a model when the data is
 * incomplete or self-contradictory.
 *
 * A chart drawn from incomplete data looks exactly like a chart drawn from
 * complete data, which is why an incomplete chart must never be drawn.
 */

import { KundliError } from './errors';
import { navamshaSignOf, signOfLongitude } from './consistencyGate';
import type { KundliCanonicalModel } from './types';
import { numeral, numeralPolicyFor } from './v40/numerals';

export const CHART_MODEL_VERSION = 'chart-model-v1';

export type ChartDivision = 1 | 9;
export type ChartLabelMode = 'EN' | 'HI' | 'BILINGUAL';

export const PLANET_IDS = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu',
] as const;
export type PlanetId = (typeof PLANET_IDS)[number];

/** Abbreviation registry. Explicit, never derived from locale data. */
export const PLANET_ABBREVIATIONS: Record<PlanetId, { en: string; hi: string; full: { en: string; hi: string } }> = {
  Sun: { en: 'Su', hi: 'सू', full: { en: 'Sun', hi: 'सूर्य' } },
  Moon: { en: 'Mo', hi: 'चं', full: { en: 'Moon', hi: 'चन्द्र' } },
  Mars: { en: 'Ma', hi: 'मं', full: { en: 'Mars', hi: 'मंगल' } },
  Mercury: { en: 'Me', hi: 'बु', full: { en: 'Mercury', hi: 'बुध' } },
  Jupiter: { en: 'Ju', hi: 'गु', full: { en: 'Jupiter', hi: 'गुरु' } },
  Venus: { en: 'Ve', hi: 'शु', full: { en: 'Venus', hi: 'शुक्र' } },
  Saturn: { en: 'Sa', hi: 'श', full: { en: 'Saturn', hi: 'शनि' } },
  Rahu: { en: 'Ra', hi: 'रा', full: { en: 'Rahu', hi: 'राहु' } },
  Ketu: { en: 'Ke', hi: 'के', full: { en: 'Ketu', hi: 'केतु' } },
};

export const LAGNA_LABELS = { en: 'Lagna', hi: 'लग्न', abbrEn: 'Lg', abbrHi: 'ल' } as const;

/**
 * Sign and house numerals for a chart (V41 §4).
 *
 * This used to index a ten-element Devanagari array directly, so signs 1-9
 * rendered as १-९ and signs 10-12 fell through to ASCII — every North Indian
 * chart in a Hindi report mixed both scripts. The policy now lives in
 * `v40/numerals` and handles multi-digit values.
 *
 * BILINGUAL deliberately uses Western digits: on a page that already carries
 * English terms, Devanagari digits are decoration rather than legibility.
 */
export const signLabel = (n: number, mode: ChartLabelMode): string =>
  numeral(n, numeralPolicyFor(mode === 'HI' ? 'hi' : 'en'));

export interface ChartPlacement {
  /** 1 for D1 Rashi, 9 for D9 Navamsha. */
  division: ChartDivision;
  /** House number, 1..12, counted from the chart Lagna. */
  houseNumber: number;
  /** Sign occupying this house, 1..12. */
  signNumber: number;
  /** Undefined for an empty house. */
  planetId?: PlanetId;
  /** Display name in the requested language. */
  displayName?: string;
  /** Abbreviation drawn inside the house. */
  abbreviation?: string;
  retrograde?: boolean;
  /** Degrees within the sign, when the canonical model carries it. */
  degreeInSign?: number;
  /** Path into the canonical model this placement came from. */
  sourcePath: string;
  /** Stable evidence identifier, e.g. CHART-D1-H3-Mars. */
  evidenceId: string;
}

export interface ChartRenderModel {
  chartModelVersion: string;
  division: ChartDivision;
  chartName: string;
  chartNameHi: string;
  chartSystem: 'NORTH_INDIAN';
  labelMode: ChartLabelMode;
  /** Sign occupying house 1, 1..12. */
  lagnaSignNumber: number;
  /** Evidence id of the Lagna marker. */
  lagnaEvidenceId: string;
  /** Exactly 12 houses, in house order. */
  houses: { houseNumber: number; signNumber: number; evidenceId: string }[];
  placements: ChartPlacement[];
  /** Deterministic textual equivalent — the accessible surface. */
  textual: string[];
  /** Content hash of the placements, for cross-surface comparison. */
  placementHash: string;
}

const isPlanetId = (v: string): v is PlanetId => (PLANET_IDS as readonly string[]).includes(v);

/** Stable, non-sensitive identifier for a placement. */
export function placementEvidenceId(division: ChartDivision, houseNumber: number, planetId?: PlanetId): string {
  return planetId
    ? `CHART-D${division}-H${houseNumber}-${planetId}`
    : `CHART-D${division}-H${houseNumber}`;
}

function hashString(input: string): string {
  // FNV-1a 32-bit — deterministic and dependency-free.
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/**
 * Builds the render model for D1 or D9 from the canonical model.
 *
 * Throws KUNDLI_CHART_INVALID — which stops delivery — for any of:
 * missing houses, duplicate house numbers, sign numbers outside 1..12,
 * unknown planet ids, a planet placed in more than one house, D1 placements
 * that disagree with the canonical planets, D9 placements that disagree with
 * the verified navamsha calculation, and a Lagna that disagrees with the
 * chart the placements are drawn on.
 */
export function buildChartRenderModel(
  canonical: KundliCanonicalModel,
  division: ChartDivision,
  labelMode: ChartLabelMode = 'EN',
): ChartRenderModel {
  const fail = (message: string, details: Record<string, unknown> = {}): never => {
    throw new KundliError('KUNDLI_CHART_INVALID', message, { division, ...details });
  };

  const canonicalHouses = canonical.houses ?? [];
  if (canonicalHouses.length !== 12) {
    fail(`canonical model has ${canonicalHouses.length} houses; a chart needs exactly 12`, {
      houses: canonicalHouses.length,
    });
  }

  const houseNumbers = new Set<number>();
  for (const h of canonicalHouses) {
    if (!Number.isInteger(h.number) || h.number < 1 || h.number > 12) {
      fail(`house number ${h.number} is not an integer in 1..12`, { house: h.number });
    }
    if (houseNumbers.has(h.number)) fail(`house ${h.number} appears more than once`, { house: h.number });
    houseNumbers.add(h.number);
  }
  for (let n = 1; n <= 12; n++) {
    if (!houseNumbers.has(n)) fail(`house ${n} is missing from the canonical model`, { house: n });
  }

  // --- Lagna -----------------------------------------------------------
  const d1LagnaSign = signOfLongitude(canonical.ascendant.longitudeDeg);
  if (canonical.ascendant.sign?.id !== d1LagnaSign) {
    fail('ascendant sign disagrees with the ascendant longitude', {
      recorded: canonical.ascendant.sign?.id,
      derived: d1LagnaSign,
    });
  }

  const divisional = canonical.divisionalCharts.find((d) => d.division === division);
  if (!divisional) {
    fail(`divisional chart D${division} is missing from the canonical model`);
    throw new Error('unreachable'); // keeps the compiler's narrowing honest
  }
  const chart = divisional;

  const SIGN_INDEX_BY_NAME: Record<string, number> = {
    Mesha: 1, Vrishabha: 2, Mithuna: 3, Karka: 4, Simha: 5, Kanya: 6,
    Tula: 7, Vrishchika: 8, Dhanu: 9, Makara: 10, Kumbha: 11, Meena: 12,
  };
  const chartLagnaSign = SIGN_INDEX_BY_NAME[chart.lagnaSign];
  if (!chartLagnaSign) {
    fail(`D${division} lagna sign "${chart.lagnaSign}" is not a recognised sign name`);
  }

  // The chart's own Lagna must agree with what the chart is built from.
  const expectedLagna = division === 1
    ? d1LagnaSign
    : navamshaSignOf(d1LagnaSign - 1, canonical.ascendant.degreeInSign);
  if (chartLagnaSign !== expectedLagna) {
    fail(`D${division} lagna is ${chartLagnaSign} but the canonical placement gives ${expectedLagna}`, {
      recorded: chartLagnaSign,
      derived: expectedLagna,
      sourcePath: `divisionalCharts[D${division}].lagnaSign`,
    });
  }

  // --- Houses ----------------------------------------------------------
  const houses = canonicalHouses
    .slice()
    .sort((a, b) => a.number - b.number)
    .map((h) => {
      const fromD1 = ((d1LagnaSign - 1 + (h.number - 1)) % 12) + 1;
      const signNumber = division === 1
        ? fromD1
        : ((chartLagnaSign - 1 + (h.number - 1)) % 12) + 1;
      if (division === 1 && h.sign?.id !== fromD1) {
        fail(`house ${h.number} records sign ${h.sign?.id} but the Lagna gives ${fromD1}`, {
          house: h.number,
          sourcePath: `houses[${h.number}].sign.id`,
        });
      }
      if (!Number.isInteger(signNumber) || signNumber < 1 || signNumber > 12) {
        fail(`house ${h.number} produced an invalid sign number ${signNumber}`);
      }
      return { houseNumber: h.number, signNumber, evidenceId: placementEvidenceId(division, h.number) };
    });

  // --- Placements ------------------------------------------------------
  const seen = new Map<PlanetId, number>();
  const placements: ChartPlacement[] = [];

  for (const raw of canonical.planets) {
    if (!isPlanetId(raw.id)) {
      fail(`unknown planet id "${raw.id}" in the canonical model`, { planet: raw.id });
    }
    // Narrowed once, after validation, so the rest of the loop is typed.
    const planet = raw as typeof raw & { id: PlanetId };
    const houseNumber = division === 1 ? planet.house : houseOfNavamsha(canonical, planet.id, chartLagnaSign);
    if (!Number.isInteger(houseNumber) || houseNumber < 1 || houseNumber > 12) {
      fail(`${planet.id} is placed in house ${houseNumber}, which is not a house`, { planet: planet.id });
    }
    if (seen.has(planet.id)) {
      fail(`${planet.id} is placed in both house ${seen.get(planet.id)} and house ${houseNumber}`, {
        planet: planet.id,
      });
    }
    seen.set(planet.id, houseNumber);

    // D1: the chart must agree with the canonical planet, sign for sign.
    if (division === 1) {
      const derivedSign = signOfLongitude(planet.longitudeDeg);
      if (planet.sign?.id !== derivedSign) {
        fail(`D1 ${planet.id} records sign ${planet.sign?.id} but its longitude gives ${derivedSign}`, {
          planet: planet.id,
          sourcePath: `planets.${planet.id}`,
        });
      }
      const house = canonicalHouses.find((h) => h.number === houseNumber);
      if (house && house.sign?.id !== derivedSign) {
        fail(`D1 ${planet.id} sits in house ${houseNumber}, whose sign is ${house.sign?.id} not ${derivedSign}`, {
          planet: planet.id,
          sourcePath: `houses[${houseNumber}].sign.id`,
        });
      }
    }

    // D9: the chart must agree with the verified navamsha calculation.
    if (division === 9) {
      const expected = navamshaSignOf(planet.sign.id - 1, planet.degreeInSign);
      const placedSign = ((chartLagnaSign - 1 + (houseNumber - 1)) % 12) + 1;
      if (placedSign !== expected) {
        fail(`D9 ${planet.id} is drawn in sign ${placedSign} but the navamsha calculation gives ${expected}`, {
          planet: planet.id,
          placedSign,
          expected,
        });
      }
    }

    const abbrev = PLANET_ABBREVIATIONS[planet.id];
    placements.push({
      division,
      houseNumber,
      signNumber: houses.find((h) => h.houseNumber === houseNumber)!.signNumber,
      planetId: planet.id,
      displayName: labelMode === 'HI'
        ? abbrev.full.hi
        : labelMode === 'BILINGUAL'
          ? `${abbrev.full.en} / ${abbrev.full.hi}`
          : abbrev.full.en,
      abbreviation: labelMode === 'HI' ? abbrev.hi : labelMode === 'BILINGUAL' ? `${abbrev.en}/${abbrev.hi}` : abbrev.en,
      retrograde: !!planet.retrograde,
      degreeInSign: planet.degreeInSign,
      sourcePath: `planets.${planet.id}`,
      evidenceId: placementEvidenceId(division, houseNumber, planet.id),
    });
  }

  // Every planet the canonical model knows must appear exactly once.
  if (seen.size !== canonical.planets.length) {
    fail('a planet appears in more than one house', { placed: seen.size, planets: canonical.planets.length });
  }
  for (const id of ['Rahu', 'Ketu'] as PlanetId[]) {
    if (!seen.has(id)) fail(`the chart is missing ${id}, so the node axis cannot be drawn`, { planet: id });
  }

  // The house occupancy lists are a second surface that claims where a graha
  // sits. They must agree with the placements derived above, and no graha may
  // be listed in two houses. Checked for D1 only: houses[].planets records
  // D1 occupancy, so comparing it against D9 placements would be meaningless.
  if (division === 1) {
    const listed = new Map<PlanetId, number[]>();
    for (const h of canonicalHouses) {
      for (const raw of (h.planets ?? []) as string[]) {
        if (!isPlanetId(raw)) {
          fail(`house ${h.number} lists an unrecognised graha "${raw}"`, { house: h.number, planet: raw });
        }
        const id = raw as PlanetId;
        const where = listed.get(id) ?? [];
        where.push(h.number);
        listed.set(id, where);
      }
    }
    for (const [id, where] of listed) {
      if (where.length > 1) {
        fail(`${id} is listed in more than one house (${where.sort((a, b) => a - b).join(', ')})`, {
          planet: id, houses: where,
        });
      }
      const placed = placements.find((x) => x.planetId === id);
      if (placed && where[0] !== placed.houseNumber) {
        fail(`${id} is listed in house ${where[0]} but is placed in house ${placed.houseNumber}`, {
          planet: id, listed: where[0], placed: placed.houseNumber,
        });
      }
    }
  }

  // Deterministic ordering: canonical planet order, then by house.
  const order = new Map(PLANET_IDS.map((id, i) => [id, i]));
  placements.sort((a, b) =>
    a.houseNumber - b.houseNumber ||
    (order.get(a.planetId!) ?? 99) - (order.get(b.planetId!) ?? 99));

  const model: ChartRenderModel = {
    chartModelVersion: CHART_MODEL_VERSION,
    division,
    chartName: division === 1 ? 'D1 Rashi' : 'D9 Navamsha',
    chartNameHi: division === 1 ? 'डी१ राशि' : 'डी९ नवमांश',
    chartSystem: 'NORTH_INDIAN',
    labelMode,
    lagnaSignNumber: chartLagnaSign,
    lagnaEvidenceId: `CHART-D${division}-LAGNA`,
    houses,
    placements,
    textual: [],
    placementHash: '',
  };

  model.textual = chartTextualEquivalent(model);
  model.placementHash = hashString(
    JSON.stringify({
      division,
      lagna: model.lagnaSignNumber,
      houses: model.houses,
      placements: model.placements.map((p) => [
        p.houseNumber, p.signNumber, p.planetId ?? '', p.retrograde ? 'R' : '',
      ]),
    }),
  );
  return model;
}

/** House counting from the chart Lagna for a navamsha placement. */
function houseOfNavamsha(
  canonical: KundliCanonicalModel,
  planetId: string,
  chartLagnaSign: number,
): number {
  const planet = canonical.planets.find((p) => p.id === planetId);
  if (!planet) return 0;
  const sign = navamshaSignOf(planet.sign.id - 1, planet.degreeInSign);
  return ((sign - chartLagnaSign + 12) % 12) + 1;
}

/**
 * Deterministic textual equivalent of the chart. This is the accessible
 * surface and the surface the consistency gate compares against the drawing.
 */
export function chartTextualEquivalent(model: ChartRenderModel): string[] {
  const lines: string[] = [];
  const label = model.labelMode === 'HI' ? model.chartNameHi : model.chartName;
  lines.push(`${label} (${model.chartSystem}, ${model.chartModelVersion})`);
  lines.push(`Lagna: sign ${model.lagnaSignNumber} (${model.lagnaEvidenceId})`);
  for (const house of model.houses) {
    const occupants = model.placements.filter((p) => p.houseNumber === house.houseNumber);
    if (occupants.length === 0) {
      lines.push(`House ${house.houseNumber}: sign ${house.signNumber} — empty (${house.evidenceId})`);
    } else {
      for (const p of occupants) {
        const retro = p.retrograde ? ', retrograde' : '';
        lines.push(
          `House ${house.houseNumber}: sign ${house.signNumber} — ${p.displayName}${retro} (${p.evidenceId})`,
        );
      }
    }
  }
  return lines;
}

/** Houses grouped for drawing, with occupants ordered canonically. */
export function occupantsByHouse(model: ChartRenderModel): Map<number, ChartPlacement[]> {
  const out = new Map<number, ChartPlacement[]>();
  for (const house of model.houses) out.set(house.houseNumber, []);
  // Only grahas occupy a house. A placement without a planetId is a marker for
  // an EMPTY house; letting one through here makes the chart layout reserve a
  // row for a label with no text, which silently squeezes the real
  // abbreviations in every other house of the chart.
  for (const p of model.placements) {
    if (!p.planetId) continue;
    out.get(p.houseNumber)?.push(p);
  }
  return out;
}
