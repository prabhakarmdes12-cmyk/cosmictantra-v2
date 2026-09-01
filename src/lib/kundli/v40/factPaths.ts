/**
 * KUNDLI V40 — canonical fact paths.
 *
 * KUNDLI_INV_006 (traceability) is only real if an evidence id can be
 * mechanically resolved back to the canonical model. Every evidence id this
 * layer emits is one of these paths, and `resolveFactPath` is the resolver the
 * data-lineage acceptance suite uses.
 *
 * Grammar:
 *   segment          .name
 *   keyed collection [key]      matched against id | number | division | name
 *
 * Examples:
 *   ascendant.degreeInSign
 *   planets[Venus].sign.en
 *   houses[10].sign.en
 *   divisionalCharts[9].lagnaSign
 *   yogas[YOGA_MALAVYA].status
 *   dashas.current.mahadasha
 */

import type { KundliCanonicalModel } from '../types';

export type FactPath = string;

const KEYED = /^([A-Za-z0-9_]+)\[([^\]]+)\]$/;

function matchKey(item: unknown, key: string): boolean {
  if (item === null || typeof item !== 'object') return false;
  const o = item as Record<string, unknown>;
  return (
    String(o.id ?? '') === key ||
    String(o.number ?? '') === key ||
    String(o.division ?? '') === key ||
    String(o.name ?? '') === key ||
    String(o.planet ?? '') === key
  );
}

/**
 * Resolves a fact path against the canonical model.
 * Returns `undefined` when the path does not exist — the lineage suite treats
 * that as a failure, which is the point.
 */
export function resolveFactPath(canonical: KundliCanonicalModel, path: FactPath): unknown {
  let node: unknown = canonical;
  for (const rawSegment of path.split('.')) {
    if (node === null || node === undefined) return undefined;
    const keyed = KEYED.exec(rawSegment);
    if (keyed) {
      const [, prop, key] = keyed;
      const collection = (node as Record<string, unknown>)[prop];
      if (!Array.isArray(collection)) return undefined;
      node = collection.find((item) => matchKey(item, key));
      continue;
    }
    node = (node as Record<string, unknown>)[rawSegment];
  }
  return node;
}

export function factExists(canonical: KundliCanonicalModel, path: FactPath): boolean {
  const v = resolveFactPath(canonical, path);
  return v !== undefined && v !== null;
}

/* ------------------------------------------------------------------ */
/* Path builders — the only place path strings are composed            */
/* ------------------------------------------------------------------ */

export const FACT = {
  lagnaSign: 'ascendant.sign.en',
  lagnaSignName: 'ascendant.sign.name',
  lagnaDegree: 'ascendant.degreeInSign',
  lagnaLongitude: 'ascendant.longitudeDeg',
  lagnaNakshatra: 'ascendant.nakshatra.name',
  lagnaLord: 'ascendant.sign.lord',

  planetSign: (p: string) => `planets[${p}].sign.en`,
  planetSignName: (p: string) => `planets[${p}].sign.name`,
  planetSignId: (p: string) => `planets[${p}].sign.id`,
  planetDegree: (p: string) => `planets[${p}].degreeInSign`,
  planetLongitude: (p: string) => `planets[${p}].longitudeDeg`,
  planetHouse: (p: string) => `planets[${p}].house`,
  planetDignity: (p: string) => `planets[${p}].dignity`,
  planetRetrograde: (p: string) => `planets[${p}].retrograde`,
  planetNakshatra: (p: string) => `planets[${p}].nakshatra.name`,
  planetPada: (p: string) => `planets[${p}].nakshatra.pada`,

  houseSign: (h: number) => `houses[${h}].sign.en`,
  houseSignId: (h: number) => `houses[${h}].sign.id`,
  houseSignLord: (h: number) => `houses[${h}].sign.lord`,
  houseOccupants: (h: number) => `houses[${h}].planets`,

  vargaLagna: (d: number) => `divisionalCharts[${d}].lagnaSign`,
  vargaPlanets: (d: number) => `divisionalCharts[${d}].planets`,

  yogaStatus: (id: string) => `yogas[${id}].status`,
  yogaRule: (id: string) => `yogas[${id}].rule`,

  currentMahadasha: 'dashas.current.mahadasha',
  currentAntardasha: 'dashas.current.antardasha',
  currentPratyantardasha: 'dashas.current.pratyantardasha',
  dashaStart: 'dashas.current.startDate',
  dashaEnd: 'dashas.current.endDate',

  tithi: 'panchanga.tithi.fullName',
  panchangaNakshatra: 'panchanga.nakshatra.name',
  panchangaPada: 'panchanga.nakshatra.pada',
  panchangaYoga: 'panchanga.yoga.name',
  panchangaKarana: 'panchanga.karana.name',
  masa: 'panchanga.masa',
  ritu: 'panchanga.ritu',
  ayana: 'panchanga.ayana',
  samvat: 'panchanga.samvat',
} as const;
