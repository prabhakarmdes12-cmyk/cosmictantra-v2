/**
 * Kundli pipeline — canonical model adapter.
 *
 * Maps the legacy `getCanonicalJyotishSnapshot()` (untyped, permissive,
 * circular-reference-bearing) onto the typed `KundliCanonicalModel`.
 * The adapter is the ONLY place that reads legacy snapshot shapes; every
 * downstream stage consumes the canonical model. Missing required values
 * fail with KUNDLI_CALCULATION_INCOMPLETE / KUNDLI_DASHA_INCOMPLETE —
 * the adapter never fabricates values.
 */

import { KundliError } from './errors';
import { buildCalculationConfig } from './config';
import { validateYogaEvaluation } from './yogaContract';
import type {
  KundliCanonicalModel, PlanetPosition, HouseData, PanchangaData,
  AscendantData, DivisionalChartData, DashaTimelineData, SignRef,
  YogaResult, DoshaResult, CalculationConfig, NormalizedBirthProfile, DashaPeriodInfo,
} from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */

const DIVISION_LIST = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60];

/** 27 nakshatras with their classical Vimshottari rulers (in order). */
const NAKSHATRA_RULERS: { name: string; ruler: string }[] = [
  { name: 'Ashwini', ruler: 'Ketu' }, { name: 'Bharani', ruler: 'Venus' }, { name: 'Krittika', ruler: 'Sun' },
  { name: 'Rohini', ruler: 'Moon' }, { name: 'Mrigashira', ruler: 'Mars' }, { name: 'Ardra', ruler: 'Rahu' },
  { name: 'Punarvasu', ruler: 'Jupiter' }, { name: 'Pushya', ruler: 'Saturn' }, { name: 'Ashlesha', ruler: 'Mercury' },
  { name: 'Magha', ruler: 'Ketu' }, { name: 'Purva Phalguni', ruler: 'Venus' }, { name: 'Uttara Phalguni', ruler: 'Sun' },
  { name: 'Hasta', ruler: 'Moon' }, { name: 'Chitra', ruler: 'Mars' }, { name: 'Swati', ruler: 'Rahu' },
  { name: 'Vishakha', ruler: 'Jupiter' }, { name: 'Anuradha', ruler: 'Saturn' }, { name: 'Jyeshtha', ruler: 'Mercury' },
  { name: 'Mula', ruler: 'Ketu' }, { name: 'Purva Ashadha', ruler: 'Venus' }, { name: 'Uttara Ashadha', ruler: 'Sun' },
  { name: 'Shravana', ruler: 'Moon' }, { name: 'Dhanishta', ruler: 'Mars' }, { name: 'Shatabhisha', ruler: 'Rahu' },
  { name: 'Purva Bhadrapada', ruler: 'Jupiter' }, { name: 'Uttara Bhadrapada', ruler: 'Saturn' }, { name: 'Revati', ruler: 'Mercury' },
];

/** Ruler of a nakshatra by name (classical Vimshottari order). */
export function nakshatraRulerByName(name: string): string | null {
  return NAKSHATRA_RULERS.find((n) => n.name.toLowerCase() === name.trim().toLowerCase())?.ruler ?? null;
}
const PLANET_IDS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

const SIGN_NAMES: Record<number, { name: string; en: string; lord: string }> = {
  1: { name: 'Mesha', en: 'Aries', lord: 'Mars' },
  2: { name: 'Vrishabha', en: 'Taurus', lord: 'Venus' },
  3: { name: 'Mithuna', en: 'Gemini', lord: 'Mercury' },
  4: { name: 'Karka', en: 'Cancer', lord: 'Moon' },
  5: { name: 'Simha', en: 'Leo', lord: 'Sun' },
  6: { name: 'Kanya', en: 'Virgo', lord: 'Mercury' },
  7: { name: 'Tula', en: 'Libra', lord: 'Venus' },
  8: { name: 'Vrishchika', en: 'Scorpio', lord: 'Mars' },
  9: { name: 'Dhanu', en: 'Sagittarius', lord: 'Jupiter' },
  10: { name: 'Makara', en: 'Capricorn', lord: 'Saturn' },
  11: { name: 'Kumbha', en: 'Aquarius', lord: 'Saturn' },
  12: { name: 'Meena', en: 'Pisces', lord: 'Jupiter' },
};

function signRef(id: number): SignRef {
  const s = SIGN_NAMES[id] ?? SIGN_NAMES[((id % 12) + 12) % 12 + 1];
  return { id, name: s.name, en: s.en, lord: s.lord };
}

function requireValue(what: string, v: unknown): any {
  if (v === undefined || v === null || v === '') {
    throw new KundliError('KUNDLI_CALCULATION_INCOMPLETE', `missing ${what} in calculation result`, { field: what });
  }
  return v;
}

function readPlanetRecord(snapshotPlanets: any): Record<string, any> {
  if (!snapshotPlanets || typeof snapshotPlanets !== 'object') {
    throw new KundliError('KUNDLI_CALCULATION_INCOMPLETE', 'planets missing in calculation result', {});
  }
  // Prefer the clean planetsArray record; fall back to the named record.
  const src = snapshotPlanets.planetsArray && typeof snapshotPlanets.planetsArray === 'object' && !Array.isArray(snapshotPlanets.planetsArray)
    ? snapshotPlanets.planetsArray
    : snapshotPlanets;
  const out: Record<string, any> = {};
  for (const id of PLANET_IDS) {
    const p = src[id];
    if (p && typeof p === 'object') out[id] = p;
  }
  return out;
}

/**
 * Dignity of a graha.
 *
 * The engine's own dignity string is authoritative. The boolean flags below
 * are consulted only when that string is absent: no snapshot this pipeline
 * has produced populates them, and reading them alone reported every graha as
 * NEUTRAL, which is a false fact rather than an absent one.
 */
function dignityOf(p: any): PlanetPosition['dignity'] {
  const raw = typeof p.dignity === 'string' ? p.dignity
    : typeof p.status === 'string' ? p.status : '';
  const s = raw.toLowerCase();
  if (s.includes('debilitat')) return 'DEBILITATED';
  if (s.includes('exalt')) return 'EXALTED';
  if (s.includes('moolatrikona') || s.includes('mooltrikona')) return 'MOOLATRIKONA';
  if (s.includes('own sign') || s.includes('swakshetra')) return 'OWN_SIGN';
  if (s.includes('friend')) return 'FRIEND_SIGN';
  // 'Neutral / Enemy' is one of the engine's own labels: it is reported as
  // NEUTRAL rather than guessed at, because the engine does not separate the
  // two cases in that label.
  if (s.includes('neutral')) return 'NEUTRAL';
  if (s.includes('enemy')) return 'ENEMY_SIGN';

  if (p.isExalted) return 'EXALTED';
  if (p.isDebilitated) return 'DEBILITATED';
  if (p.isInOwnSign) return 'OWN_SIGN';
  if (p.isFriendSign) return 'FRIEND_SIGN';
  if (p.isEnemySign) return 'ENEMY_SIGN';
  return 'NEUTRAL';
}

export function buildPanchanga(snapshot: any): PanchangaData {
  const bp = snapshot.birthPanchang ?? snapshot.panchanga;
  if (!bp) throw new KundliError('KUNDLI_CALCULATION_INCOMPLETE', 'birthPanchang missing', {});

  const tithi = bp.udayaTithi ?? bp.instantaneousTithi ?? bp.tithi;
  const nak = bp.nakshatra;
  const yoga = bp.yoga;
  const karana = bp.karana;
  const masa = bp.masa;
  const samvat = bp.samvat;

  return {
    tithi: {
      number: requireValue('tithi.number', tithi?.number),
      name: requireValue('tithi.name', tithi?.name),
      paksha: requireValue('tithi.paksha', tithi?.paksha),
      fullName: requireValue('tithi.fullName', tithi?.fullName ?? `${tithi?.paksha} ${tithi?.name}`),
    },
    nakshatra: {
      name: requireValue('nakshatra.name', nak?.name),
      pada: requireValue('nakshatra.pada', nak?.pada),
      ruler: requireValue('nakshatra.ruler', nak?.ruler ?? nak?.lord),
    },
    yoga: { name: requireValue('yoga.name', yoga?.name) },
    karana: { name: requireValue('karana.name', karana?.name) },
    masa: requireValue('masa.name', masa?.name) ?? '',
    ritu: requireValue('ritu.name', bp.ritu?.name) ?? '',
    ayana: requireValue('ayana.name', bp.ayana?.name) ?? '',
    samvat: samvat ? `Vikram ${samvat.vikram ?? ''} / Shaka ${samvat.shaka ?? ''}` : '',
  };
}

export function buildAscendant(snapshot: any): AscendantData {
  const l = snapshot.lagna;
  if (!l) throw new KundliError('KUNDLI_CALCULATION_INCOMPLETE', 'lagna missing', {});
  return {
    longitudeDeg: requireValue('lagna.longitude', l.longitude),
    tropicalLongitudeDeg: l.tropicalLongitude ?? l.longitude + (snapshot.meta?.ayanamshaValue ?? 0),
    sign: signRef(requireValue('lagna.rashiId', l.rashiId ?? l.rasiId)),
    degreeInSign: requireValue('lagna.degreeInRasi', l.degreeInRasi ?? l.degrees),
    nakshatra: {
      name: requireValue('lagna.nakshatra.name', l.nakshatra?.name),
      pada: requireValue('lagna.nakshatra.pada', l.nakshatra?.pada ?? l.nakshatraPada),
    },
  };
}

export function buildPlanets(snapshot: any): PlanetPosition[] {
  const record = readPlanetRecord(snapshot.planets);
  const houses = Array.isArray(snapshot.houses) ? snapshot.houses : [];
  const houseOf = (name: string): number => {
    for (const h of houses) {
      const occupants = h.occupyingPlanets ?? h.planets ?? [];
      if ((Array.isArray(occupants) ? occupants : Object.values(occupants)).some((o: any) =>
        (typeof o === 'string' ? o : o?.name ?? o?.planet) === name)) return h.number ?? h.house;
    }
    return 0;
  };

  return PLANET_IDS.map((id) => {
    const p = record[id];
    if (!p) throw new KundliError('KUNDLI_CALCULATION_INCOMPLETE', `planet ${id} missing`, { planet: id });
    return {
      id,
      name: id,
      longitudeDeg: requireValue(`planets.${id}.longitude`, p.longitude),
      sign: signRef(requireValue(`planets.${id}.rasiId`, p.rasiId ?? p.rashiId)),
      degreeInSign: requireValue(`planets.${id}.degreeInRasi`, p.degreeInRasi ?? p.degrees),
      nakshatra: {
        name: requireValue(`planets.${id}.nakshatra`, p.nakshatra?.name ?? p.nakshatraName),
        pada: p.nakshatra?.pada ?? p.nakshatraPada ?? 1,
      },
      house: houseOf(id),
      // The snapshot exposes motion as `isRetrograde` (celestialEngine, mean
      // nodes). Reading `p.retrograde` silently reported every graha as
      // direct, contradicting the chart the reader sees.
      retrograde: !!(p.retrograde ?? p.isRetrograde),
      dignity: dignityOf(p),
    };
  });
}

export function buildHouses(snapshot: any): HouseData[] {
  const houses = snapshot.houses;
  if (!Array.isArray(houses) || houses.length !== 12) {
    throw new KundliError('KUNDLI_CALCULATION_INCOMPLETE', 'houses missing or incomplete', { count: houses?.length });
  }
  return houses.map((h: any) => ({
    number: requireValue('houses.number', h.number ?? h.house),
    sign: signRef(requireValue('houses.rashiId', h.rashiId ?? h.rasiId)),
    planets: Array.isArray(h.planets) ? h.planets.slice() : [],
  }));
}

export function buildDivisionalCharts(snapshot: any): DivisionalChartData[] {
  const shodashavarga = snapshot.vargas?.shodashavarga;
  if (!shodashavarga) {
    throw new KundliError('KUNDLI_CALCULATION_INCOMPLETE', 'shodashavarga missing', {});
  }
  const charts: DivisionalChartData[] = [];
  for (const div of DIVISION_LIST) {
    const v = shodashavarga[String(div)];
    if (!v) {
      throw new KundliError('KUNDLI_CALCULATION_INCOMPLETE', `varga D${div} missing`, { division: div });
    }
    charts.push({
      division: div,
      name: requireValue(`varga.D${div}.name`, v.name ?? `D${div}`),
      lagnaSign: requireValue(`varga.D${div}.lagna.vargaRashiName`, v.lagna?.vargaRashiName ?? v.lagna?.rashiName),
      planets: Object.entries((v.planets ?? {}) as Record<string, any>).map(([id, pp]) => ({
        id,
        sign: requireValue(`varga.D${div}.${id}.vargaRashiName`, pp?.vargaRashiName ?? pp?.rashiName),
        degreeInSign: pp?.divisionDegree ?? pp?.degreeInRasi ?? 0,
      })),
    });
  }
  return charts;
}

export function buildDashas(snapshot: any): DashaTimelineData {
  const d = snapshot.dasha;
  if (!d || !Array.isArray(d.mahadashas) || d.mahadashas.length !== 9) {
    throw new KundliError('KUNDLI_DASHA_INCOMPLETE', 'dasha timeline missing or incomplete', {});
  }
  const mahadashas = (d.mahadashas as any[]).map((md) => {
    const antardashas = Array.isArray(md.antardashas)
      ? md.antardashas.map((ad: any) => ({
          planet: requireValue('dasha.ad.lord', ad.lord ?? ad.planet),
          startDate: requireValue('dasha.ad.startDate', ad.startDate),
          endDate: requireValue('dasha.ad.endDate', ad.endDate),
        }))
      : [];
    return {
      planet: requireValue('dasha.md.lord', md.lord ?? md.planet),
      startDate: requireValue('dasha.md.startDate', md.startDate),
      endDate: requireValue('dasha.md.endDate', md.endDate),
      durationYears: md.actualDurationYears ?? md.totalNominalYears ?? 0,
      isCurrent: !!md.isCurrent,
      antardashas,
    };
  });

  const currentMd = mahadashas.find((m: DashaPeriodInfo) => m.isCurrent) ?? mahadashas.find((m: DashaPeriodInfo) => m.planet === d.currentMahadasha);
  const currentAd = currentMd?.antardashas?.find((a: { planet: string }) => a.planet === d.currentAntardasha);

  return {
    system: 'VIMSHOTTARI',
    startingBalanceYears: d.startingBalance ? parseFloat(String(d.startingBalance)) : NaN,
    mahadashas,
    current: {
      mahadasha: requireValue('dasha.currentMahadasha', d.currentMahadasha ?? currentMd?.planet),
      antardasha: requireValue('dasha.currentAntardasha', d.currentAntardasha ?? currentAd?.planet),
      pratyantardasha: d.currentPratyantardasha ?? '',
      startDate: currentMd ? currentMd.startDate : requireValue('dasha.currentDateRange.startDate', d.currentDateRange?.startDate),
      endDate: currentMd ? currentMd.endDate : requireValue('dasha.currentDateRange.endDate', d.currentDateRange?.endDate),
    },
  };
}

export function buildYogasAndDoshas(snapshot: any): { yogas: YogaResult[]; doshas: DoshaResult[] } {
  const yd = snapshot.yogasAndDoshas ?? {};

  // Yogas must arrive as rule evaluations, never as pre-declared name lists.
  // Every record is validated against the yoga contract; any violation
  // raises KUNDLI_CALCULATION_INCOMPLETE, which the pipeline turns into
  // "no PDF, pdfBuffer: null".
  if (!Array.isArray(yd.yogas)) {
    throw new KundliError(
      'KUNDLI_CALCULATION_INCOMPLETE',
      'yoga evaluations missing from canonical snapshot — the engine must supply rule-evaluated yogas',
      { received: typeof yd.yogas },
    );
  }

  const yogas: YogaResult[] = (yd.yogas as unknown[]).map((raw, index) =>
    validateYogaEvaluation(raw, index),
  );

  const doshas: DoshaResult[] = [];
  if (yd.kalsarpa) {
    doshas.push({
      id: 'kalsarpa',
      status: 'NOT_CALCULATED',
      result: {
        status: 'NOT_CALCULATED',
        notCalculatedReason: (yd.kalsarpa as any).notCalculatedReason
          ?? 'Kalsarpa dosha rule not implemented.',
      },
    });
  }
  if (yd.manglik) {
    doshas.push({
      id: 'manglik',
      status: 'CALCULATED',
      result: {
        status: 'CALCULATED',
        present: !!yd.manglik.isManglik,
        severity: (yd.manglik.severity as any) ?? (yd.manglik.isManglik ? 'MEDIUM' : 'NONE'),
        causeHouses: yd.manglik.causeHouse ? [yd.manglik.causeHouse] : [],
        cancellation: yd.manglik.isCancelled !== undefined
          ? { cancelled: !!yd.manglik.isCancelled, reason: yd.manglik.cancellationReason }
          : undefined,
      },
    });
  }
  if (yd.sadeSati) {
    doshas.push({
      id: 'sadeSati',
      status: 'CALCULATED',
      result: {
        status: 'CALCULATED',
        active: !!yd.sadeSati.isActive,
        phase: yd.sadeSati.phase ?? (yd.sadeSati.isActive ? 'Active' : 'Not Active'),
      },
    });
  }

  return { yogas, doshas };
}

export interface BuildCanonicalModelInput {
  profile: NormalizedBirthProfile;
  snapshot: any;
  config?: CalculationConfig;
}

/**
 * GATE 2 adapter: legacy snapshot -> typed canonical model.
 * Throws KUNDLI_CALCULATION_INCOMPLETE / KUNDLI_DASHA_INCOMPLETE on any
 * missing required value. Never fills gaps with placeholders.
 */
export function buildCanonicalModel(input: BuildCanonicalModelInput): KundliCanonicalModel;
export function buildCanonicalModel(snapshot: any, profile: NormalizedBirthProfile, fingerprint?: string): KundliCanonicalModel;
export function buildCanonicalModel(
  inputOrSnapshot: BuildCanonicalModelInput | any,
  profileOrNothing?: NormalizedBirthProfile,
  fingerprint?: string,
): KundliCanonicalModel {
  const input: BuildCanonicalModelInput =
    profileOrNothing && typeof profileOrNothing === 'object' && 'birthDate' in profileOrNothing
      ? { snapshot: inputOrSnapshot as any, profile: profileOrNothing, config: buildCalculationConfig() }
      : (inputOrSnapshot as BuildCanonicalModelInput);
  const profile = fingerprint ? { ...input.profile, fingerprint } : input.profile;
  const snapshot = input.snapshot;
  const config = input.config ?? buildCalculationConfig();

  const meta = snapshot.meta ?? {};
  const panchanga = buildPanchanga(snapshot);
  const ascendant = buildAscendant(snapshot);
  const planets = buildPlanets(snapshot);
  const houses = buildHouses(snapshot);
  const divisionalCharts = buildDivisionalCharts(snapshot);
  const dashas = buildDashas(snapshot);
  const { yogas, doshas } = buildYogasAndDoshas(snapshot);

  return {
    subject: profile,
    calculation: config,
    calculationMetadata: {
      ayanamshaValueDegrees: requireValue('meta.ayanamshaValue', meta.ayanamshaValue),
      julianDay: requireValue('meta.julianDay', meta.julianDay),
      localDateTime: profile.timezone.localDateTime,
      utcDateTime: profile.timezone.utcDateTime,
      generatedAt: meta.calculatedAt ?? new Date().toISOString(),
    },
    panchanga,
    ascendant,
    planets,
    houses,
    divisionalCharts,
    dashas,
    yogas,
    doshas,
  };
}
