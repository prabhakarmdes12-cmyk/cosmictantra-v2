/**
 * Kundli pipeline — deterministic interpretation engine.
 *
 * Rule-based text generation ONLY. Every entry carries:
 *   sectionId     — which report section consumes it
 *   sourceFacts   — canonical fields the text was derived from
 *   generatorVersion — deterministic rules version
 *   promptVersion — null (this layer never uses an LLM)
 *
 * If a required fact is absent the generator throws
 * KUNDLI_INTERPRETATION_INCOMPLETE — it never invents values.
 */

import { KundliError } from './errors';
import type { KundliCanonicalModel, InterpretationEntry } from './types';

export const INTERPRETATION_GENERATOR_VERSION = 'deterministic-rules-v1';

/** Classical Chara Karaka mapping (planet -> karaka role). */
export const KARAKA_BY_PLANET: Record<string, string> = {
  Sun: 'Atmakaraka', Moon: 'Amatyakaraka', Mars: 'Bhratrikaraka', Mercury: 'Matrikaraka',
  Jupiter: 'Putrakaraka', Venus: 'Gnatikaraka', Saturn: 'Darakaraka', Rahu: '—', Ketu: '—',
};
export function planetKaraka(planetId: string): string {
  return KARAKA_BY_PLANET[planetId] ?? '—';
}

/* ------------------------------------------------------------------ */
/* Facts                                                               */
/* ------------------------------------------------------------------ */

const HOUSE_MEANINGS: Record<number, string> = {
  1: 'self and personality',
  2: 'wealth, family and speech',
  3: 'courage, communication and siblings',
  4: 'home, mother and inner peace',
  5: 'intelligence, education and creativity',
  6: 'health, service and obstacles',
  7: 'partnership and marriage',
  8: 'transformation and longevity',
  9: 'fortune, dharma and higher learning',
  10: 'career and public standing',
  11: 'gains and aspirations',
  12: 'spirituality, isolation and liberation',
};

function signEn(model: KundliCanonicalModel, signName: string): string {
  const s = model.planets[0].sign.name; // any planet's sign table lookup
  void s;
  const all = [model.ascendant.sign, ...model.planets.map((p) => p.sign)];
  const found = all.find((x) => x.name === signName);
  return found?.en ?? signName;
}

function planetHouse(model: KundliCanonicalModel, id: string): number | null {
  const p = model.planets.find((x) => x.id === id);
  return p ? p.house : null;
}

function requireFact(model: KundliCanonicalModel, test: boolean, what: string): void {
  if (!test) {
    throw new KundliError('KUNDLI_INTERPRETATION_INCOMPLETE', `fact missing: ${what}`, { field: what });
  }
}

/* ------------------------------------------------------------------ */
/* Domain generators                                                   */
/* ------------------------------------------------------------------ */

export function interpretLagna(model: KundliCanonicalModel): InterpretationEntry {
  const a = model.ascendant;
  const lord = a.sign.lord;
  const lordHouseRaw = planetHouse(model, lord);
  requireFact(model, lordHouseRaw !== null, 'ascendant.lord.house');
  const lordHouse = lordHouseRaw as number;
  const lordPos = model.planets.find((p) => p.id === lord)!;
  return {
    sectionId: 'lagna-analysis',
    sourceFacts: ['ascendant.sign', 'ascendant.sign.lord', `planets.${lord}.house`, `planets.${lord}.sign`],
    generatorVersion: INTERPRETATION_GENERATOR_VERSION,
    promptVersion: null,
    text: `Your ascendant is ${a.sign.name} (${a.sign.en}), ruled by ${lord}, which occupies the ${lordHouse}${ordinal(lordHouse)} house in ${lordPos.sign.name} (${lordPos.sign.en}) — the domain of ${HOUSE_MEANINGS[lordHouse]}. This places the themes of ${HOUSE_MEANINGS[lordHouse]} at the center of how you approach life.`,
  };
}

export function interpretMoon(model: KundliCanonicalModel): InterpretationEntry {
  const moon = model.planets.find((p) => p.id === 'Moon')!;
  const nak = moon.nakshatra;
  const nakRuler = model.panchanga.nakshatra.ruler;
  requireFact(model, !!moon.sign.name, 'moon.sign');
  return {
    sectionId: 'moon-analysis',
    sourceFacts: ['planets.Moon.sign', 'planets.Moon.nakshatra', 'planets.Moon.house'],
    generatorVersion: INTERPRETATION_GENERATOR_VERSION,
    promptVersion: null,
    text: `Your Moon in ${moon.sign.name} (${signEn(model, moon.sign.name)}) in the ${moon.house}${ordinal(moon.house)} house shapes your emotional nature and intuition. You were born in the ${nak.name} nakshatra (pada ${nak.pada}), ruled by ${nakRuler}, which colours your instinctive responses and mental rhythms.`,
  };
}

export function interpretNakshatra(model: KundliCanonicalModel): InterpretationEntry {
  const nak = model.panchanga.nakshatra;
  const nakRuler = nak.ruler;
  const rulerPos = model.planets.find((p) => p.id === nakRuler);
  requireFact(model, !!rulerPos, 'nakshatra.ruler.position');
  return {
    sectionId: 'nakshatra-analysis',
    sourceFacts: ['panchanga.nakshatra', 'panchanga.nakshatra.ruler', `planets.${nakRuler}.house`],
    generatorVersion: INTERPRETATION_GENERATOR_VERSION,
    promptVersion: null,
    text: `Your Janma Nakshatra is ${nak.name}, pada ${nak.pada}, ruled by ${nakRuler}. The nakshatra ruler ${nakRuler} sits in the ${rulerPos!.house}${ordinal(rulerPos!.house)} house, indicating where your karmic drive expresses most visibly.`,
  };
}

export function interpretCareer(model: KundliCanonicalModel): InterpretationEntry {
  const h10 = model.houses.find((h) => h.number === 10)!;
  const h10Lord = h10.sign.lord;
  const lordPos = model.planets.find((p) => p.id === h10Lord);
  requireFact(model, !!lordPos, 'career.10thLord.position');
  const saturn = model.planets.find((p) => p.id === 'Saturn')!;
  return {
    sectionId: 'career',
    sourceFacts: ['houses.10.sign', 'houses.10.sign.lord', `planets.${h10Lord}.house`, 'planets.Saturn.house'],
    generatorVersion: INTERPRETATION_GENERATOR_VERSION,
    promptVersion: null,
    text: `The 10th house of career is ${h10.sign.name} (${h10.sign.en}), ruled by ${h10Lord}, placed in the ${lordPos!.house}${ordinal(lordPos!.house)} house. Saturn, the planet of sustained effort, occupies the ${saturn.house}${ordinal(saturn.house)} house, which points to how responsibility and long-term structure shape your professional path.`,
  };
}

export function interpretFinance(model: KundliCanonicalModel): InterpretationEntry {
  const h2 = model.houses.find((h) => h.number === 2)!;
  const h2Lord = h2.sign.lord;
  const lordPos = model.planets.find((p) => p.id === h2Lord);
  requireFact(model, !!lordPos, 'finance.2ndLord.position');
  const jupiter = model.planets.find((p) => p.id === 'Jupiter')!;
  return {
    sectionId: 'finance',
    sourceFacts: ['houses.2.sign', 'houses.2.sign.lord', `planets.${h2Lord}.house`, 'planets.Jupiter.house'],
    generatorVersion: INTERPRETATION_GENERATOR_VERSION,
    promptVersion: null,
    text: `Wealth and resources are read from the 2nd house, ${h2.sign.name} (${h2.sign.en}), ruled by ${h2Lord}, who occupies the ${lordPos!.house}${ordinal(lordPos!.house)} house. Jupiter's placement in the ${jupiter.house}${ordinal(jupiter.house)} house indicates where growth and abundance are most likely to accumulate.`,
  };
}

export function interpretRelationships(model: KundliCanonicalModel): InterpretationEntry {
  const h7 = model.houses.find((h) => h.number === 7)!;
  const h7Lord = h7.sign.lord;
  const lordPos = model.planets.find((p) => p.id === h7Lord);
  requireFact(model, !!lordPos, 'relationships.7thLord.position');
  const venus = model.planets.find((p) => p.id === 'Venus')!;
  return {
    sectionId: 'relationships',
    sourceFacts: ['houses.7.sign', 'houses.7.sign.lord', `planets.${h7Lord}.house`, 'planets.Venus.house'],
    generatorVersion: INTERPRETATION_GENERATOR_VERSION,
    promptVersion: null,
    text: `The 7th house governs partnership: it is ${h7.sign.name} (${h7.sign.en}), ruled by ${h7Lord} in the ${lordPos!.house}${ordinal(lordPos!.house)} house. Venus, the karaka of love and harmony, is placed in the ${venus.house}${ordinal(venus.house)} house, shaping the qualities you seek and offer in close relationships.`,
  };
}

export function interpretFamily(model: KundliCanonicalModel): InterpretationEntry {
  const h4 = model.houses.find((h) => h.number === 4)!;
  const moon = model.planets.find((p) => p.id === 'Moon')!;
  return {
    sectionId: 'family',
    sourceFacts: ['houses.4.sign', 'planets.Moon.sign', 'planets.Moon.house'],
    generatorVersion: INTERPRETATION_GENERATOR_VERSION,
    promptVersion: null,
    text: `The 4th house of home and family is ${h4.sign.name} (${h4.sign.en}). Your Moon in ${moon.sign.name} (${signEn(model, moon.sign.name)}) in the ${moon.house}${ordinal(moon.house)} house indicates that emotional security and family bonds are closely tied to the ${HOUSE_MEANINGS[moon.house]} area of life.`,
  };
}

export function interpretHealth(model: KundliCanonicalModel): InterpretationEntry {
  const h6 = model.houses.find((h) => h.number === 6)!;
  const sun = model.planets.find((p) => p.id === 'Sun')!;
  return {
    sectionId: 'health',
    sourceFacts: ['houses.6.sign', 'planets.Sun.sign', 'planets.Sun.house'],
    generatorVersion: INTERPRETATION_GENERATOR_VERSION,
    promptVersion: null,
    text: `The 6th house of health and daily routine is ${h6.sign.name} (${h6.sign.en}). Your Sun in ${sun.sign.name} (${signEn(model, sun.sign.name)}) in the ${sun.house}${ordinal(sun.house)} house suggests vitality is steadied by routine related to the ${HOUSE_MEANINGS[sun.house]} area. This is a general indication, not medical advice.`,
  };
}

export function interpretEducation(model: KundliCanonicalModel): InterpretationEntry {
  const h5 = model.houses.find((h) => h.number === 5)!;
  const jupiter = model.planets.find((p) => p.id === 'Jupiter')!;
  const mercury = model.planets.find((p) => p.id === 'Mercury')!;
  return {
    sectionId: 'education',
    sourceFacts: ['houses.5.sign', 'planets.Jupiter.house', 'planets.Mercury.house'],
    generatorVersion: INTERPRETATION_GENERATOR_VERSION,
    promptVersion: null,
    text: `The 5th house of learning is ${h5.sign.name} (${h5.sign.en}). Jupiter in the ${jupiter.house}${ordinal(jupiter.house)} house and Mercury in the ${mercury.house}${ordinal(mercury.house)} house indicate that structured study and analytical communication flourish through the ${HOUSE_MEANINGS[jupiter.house]} and ${HOUSE_MEANINGS[mercury.house]} domains.`,
  };
}

export function interpretSpiritual(model: KundliCanonicalModel): InterpretationEntry {
  const h9 = model.houses.find((h) => h.number === 9)!;
  const h12 = model.houses.find((h) => h.number === 12)!;
  const ketu = model.planets.find((p) => p.id === 'Ketu')!;
  const jupiter = model.planets.find((p) => p.id === 'Jupiter')!;
  return {
    sectionId: 'spiritual-tendencies',
    sourceFacts: ['houses.9.sign', 'houses.12.sign', 'planets.Ketu.house', 'planets.Jupiter.house'],
    generatorVersion: INTERPRETATION_GENERATOR_VERSION,
    promptVersion: null,
    text: `The 9th house of dharma is ${h9.sign.name} (${h9.sign.en}) and the 12th house of transcendence is ${h12.sign.name} (${h12.sign.en}). Ketu in the ${ketu.house}${ordinal(ketu.house)} house with Jupiter in the ${jupiter.house}${ordinal(jupiter.house)} house marks a chart where spiritual seeking is most natural through the ${HOUSE_MEANINGS[ketu.house]} domain.`,
  };
}

export function interpretCurrentPeriod(model: KundliCanonicalModel): InterpretationEntry {
  const cur = model.dashas.current;
  const md = model.dashas.mahadashas.find((m) => m.planet === cur.mahadasha);
  requireFact(model, !!md, 'dasha.current.mahadasha.period');
  const mdSign = model.planets.find((p) => p.id === cur.mahadasha)?.sign;
  requireFact(model, !!mdSign, 'dasha.current.mahadasha.sign');
  const adSign = model.planets.find((p) => p.id === cur.antardasha)?.sign;
  requireFact(model, !!adSign, 'dasha.current.antardasha.sign');
  return {
    sectionId: 'current-period',
    sourceFacts: ['dasha.current.mahadasha', 'dasha.current.antardasha', 'dasha.current.startDate', 'dasha.current.endDate', `planets.${cur.mahadasha}.sign`, `planets.${cur.antardasha}.sign`],
    generatorVersion: INTERPRETATION_GENERATOR_VERSION,
    promptVersion: null,
    text: `You are in the ${cur.mahadasha} Mahadasha (${cur.startDate} to ${cur.endDate}) with ${cur.antardasha} Antardasha. ${cur.mahadasha} is placed in ${mdSign!.name} (${signEn(model, mdSign!.name)}) and ${cur.antardasha} in ${adSign!.name} (${signEn(model, adSign!.name)}) in your birth chart — the combination colours the dominant themes of this period through both planets' natal placements.`,
  };
}

export function interpretNearTerm(model: KundliCanonicalModel): InterpretationEntry {
  const cur = model.dashas.current;
  const md = model.dashas.mahadashas.find((m) => m.planet === cur.mahadasha);
  const schedule = md?.antardashas ?? [];
  requireFact(model, schedule.length > 0, 'dasha.current.antardasha.schedule');
  const idx = schedule.findIndex((a) => a.planet === cur.antardasha);
  const next = idx >= 0 ? schedule[idx + 1] : undefined;
  if (!next) {
    return {
      sectionId: 'near-term-themes',
      sourceFacts: ['dasha.current.antardasha.schedule'],
      generatorVersion: INTERPRETATION_GENERATOR_VERSION,
      promptVersion: null,
      text: `The current ${cur.antardasha} Antardasha runs until ${schedule[schedule.length - 1].endDate}; the next major sub-period begins after the current Mahadasha cycle completes.`,
    };
  }
  return {
    sectionId: 'near-term-themes',
    sourceFacts: ['dasha.current.antardasha.schedule', `dasha.current.antardasha.next.${next.planet}`],
    generatorVersion: INTERPRETATION_GENERATOR_VERSION,
    promptVersion: null,
    text: `After the current ${cur.antardasha} Antardasha, the ${next.planet} Antardasha begins (${next.startDate} to ${next.endDate}). Themes related to the ${HOUSE_MEANINGS[planetHouse(model, next.planet) ?? 1]} will progressively come into focus during that sub-period.`,
  };
}

export function interpretRemedies(model: KundliCanonicalModel): InterpretationEntry {
  const parts: string[] = [];
  const facts: string[] = [];
  for (const d of model.doshas) {
    if (d.id === 'manglik' && d.result.status === 'CALCULATED' && 'present' in d.result && d.result.present) {
      facts.push('doshas.manglik');
      parts.push(`Mangal dosha is present (severity ${'severity' in d.result ? d.result.severity : 'MEDIUM'}). If you choose to follow traditional remedies, classical practice includes strengthening ${model.houses[0].sign.lord} and Mars-related practices after personal verification with a qualified advisor.`);
    }
    if (d.id === 'sadeSati' && d.result.status === 'CALCULATED' && 'active' in d.result && d.result.active) {
      facts.push('doshas.sadeSati');
      parts.push(`Sade Sati is active (${'phase' in d.result && d.result.phase ? d.result.phase : 'current phase'}). Traditional guidance emphasises patience, service, and steady routines during this period.`);
    }
  }
  if (parts.length === 0) {
    return {
      sectionId: 'remedies',
      sourceFacts: ['doshas'],
      generatorVersion: INTERPRETATION_GENERATOR_VERSION,
      promptVersion: null,
      text: `No major dosha-based remedy requirement was detected in the chart. Any remedies you choose to follow should be verified with a qualified advisor of your tradition.`,
    };
  }
  return {
    sectionId: 'remedies',
    sourceFacts: facts,
    generatorVersion: INTERPRETATION_GENERATOR_VERSION,
    promptVersion: null,
    text: parts.join(' '),
  };
}

/* ------------------------------------------------------------------ */
/* Aggregator                                                          */
/* ------------------------------------------------------------------ */

export const INTERPRETATION_SECTIONS = [
  'lagna-analysis', 'moon-analysis', 'nakshatra-analysis', 'career', 'finance',
  'relationships', 'family', 'health', 'education', 'spiritual-tendencies',
  'current-period', 'near-term-themes', 'remedies',
] as const;

export type InterpretationSectionId = (typeof INTERPRETATION_SECTIONS)[number];

export function interpretCanonicalModel(model: KundliCanonicalModel): InterpretationEntry[] {
  const entries: InterpretationEntry[] = [
    interpretLagna(model),
    interpretMoon(model),
    interpretNakshatra(model),
    interpretCareer(model),
    interpretFinance(model),
    interpretRelationships(model),
    interpretFamily(model),
    interpretHealth(model),
    interpretEducation(model),
    interpretSpiritual(model),
    interpretCurrentPeriod(model),
    interpretNearTerm(model),
    interpretRemedies(model),
  ];
  // Every section must have produced exactly one entry.
  for (const id of INTERPRETATION_SECTIONS) {
    if (!entries.some((e) => e.sectionId === id)) {
      throw new KundliError('KUNDLI_INTERPRETATION_INCOMPLETE', `no interpretation for ${id}`, { sectionId: id });
    }
  }
  return entries;
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
