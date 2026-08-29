/**
 * KASHI CONTRACT
 * ==============
 * Kashi (the AI assistant) may QUERY deterministic evidence. It MUST NOT
 * calculate those values itself. This module is the ONLY sanctioned bridge:
 * it returns already-computed deterministic evidence for Kashi to interpret.
 *
 * Guarantee: every value here comes from the canonical snapshot / professional
 * derivations. Kashi consumes; Kashi does not compute.
 */

import { professionalChart } from './index.js';
import { computeGochar } from './gochar.js';

/**
 * Retrieve a bundle of deterministic evidence relevant to an intent.
 * @param {object} birthParams
 * @param {object} opts { intent, targetDate, userContext }
 * @returns evidence object (calculations only — no interpretation)
 */
export function retrieveEvidence(birthParams, opts = {}) {
  const pro = professionalChart(birthParams, { targetDate: opts.targetDate });
  const intent = (opts.intent || '').toLowerCase();

  const evidence = {
    contract: 'KASHI may interpret this evidence; KASHI must not recompute it.',
    provenance: 'CosmicTantra canonical deterministic engine (no LLM, no paid API).',
    birthDetails: pro.kundali.meta,
    lagna: { sign: pro.kundali.lagna.rashiEn, degree: pro.kundali.lagna.degreeStr, nakshatra: pro.kundali.lagna.nakshatra.name },
    moon: { sign: pro.kundali.moon.rashiEn, nakshatra: pro.kundali.moon.nakshatra.name, pada: pro.kundali.moon.pada },
    currentDasha: pro.vimshottari.activeChain,
  };

  // Intent-aware evidence retrieval (career, marriage, health, wealth, timing).
  if (/career|job|work|profession|change/.test(intent)) {
    evidence.d1 = summariseChart(pro.varga('D1'));
    evidence.d10 = summariseChart(pro.varga('D10'));
    evidence.shadbala = pro.shadbala.ranking;
    evidence.tenthHouse = houseSummary(pro.kundali, 10);
    evidence.gochar = summariseGochar(pro.kundali, opts.targetDate);
    evidence.ashtakavargaSAV = pro.ashtakavarga.sarva.bindus;
  }
  if (/marri|spouse|partner|relationship|love/.test(intent)) {
    evidence.d9 = summariseChart(pro.varga('D9'));
    evidence.seventhHouse = houseSummary(pro.kundali, 7);
    evidence.upapada = pro.jaimini.upapada;
    evidence.venus = planetSummary(pro.kundali, 'Venus');
  }
  if (/health|illness|disease/.test(intent)) {
    evidence.sixthHouse = houseSummary(pro.kundali, 6);
    evidence.d30 = summariseChart(pro.varga('D30'));
    evidence.sensitiveVargas = pro.special.sensitiveVargas;
  }
  if (/wealth|money|finance|dhan/.test(intent)) {
    evidence.d2 = summariseChart(pro.varga('D2'));
    evidence.secondHouse = houseSummary(pro.kundali, 2);
    evidence.eleventhHouse = houseSummary(pro.kundali, 11);
    evidence.induLagna = pro.special.specialLagnas.induLagna;
    evidence.dhanaYogas = pro.yogas.detected.filter((y) => /dhana|raja/i.test(y.id));
  }

  // Always include detected yogas/doshas as evidence context.
  evidence.detectedYogas = pro.yogas.detected.map((y) => ({ name: y.name, family: y.family, evidence: y.evidence }));

  return evidence;
}

function summariseChart(v) {
  return { code: v.code, lagnaSign: v.lagnaSignName, planets: v.planets.map((p) => ({ name: p.name, sign: p.signName, house: p.house })) };
}
function houseSummary(k, h) {
  const house = k.houses[h - 1];
  return { house: h, sign: house.rashiEn, lord: house.lord, significance: house.significance, occupants: house.planets };
}
function planetSummary(k, name) {
  const p = k.planets.find((x) => x.name === name);
  return { name, sign: p.rashiEn, house: p.house, nakshatra: p.nakshatra.name, dignity: p.dignity, retrograde: p.isRetrograde };
}
function summariseGochar(k, targetDate) {
  const g = computeGochar(k, targetDate ? new Date(targetDate) : new Date());
  return g.houseTransits.map((t) => ({ planet: t.planet, sign: t.signName, natalHouse: t.natalHouse, savBindus: t.savBindusInSign, retrograde: t.isRetrograde }));
}

export default { retrieveEvidence };
