/**
 * PROFESSIONAL BALA — Shadbala, Bhava Bala, Vimshopaka, Ishta/Kashta.
 * Convention: IMPLEMENTED_CONVENTION_BPHS.
 *
 * NOTE (Rule 1): These are IMPLEMENTED. They are queued for external numerical
 * comparison (see OFFLINE_SOFTWARE_DIFFERENTIAL_QUEUE) and are NOT labelled
 * QUALIFIED. Some sub-balas (Kaala/Ayana) use an analytic solar model.
 */

import { signOf, degInSign, norm360, SIGN_LORDS, isOddSign, SIGN_MODALITY } from './math.js';
import { getDignity } from '../astrologyEngine.js';
import { computeVarga } from './vargas.js';

const SAPTA = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

// Exaltation longitudes (deep) for Uchcha Bala.
const EXALT_LON = { Sun: 10, Moon: 33, Mars: 298, Mercury: 165, Jupiter: 95, Venus: 357, Saturn: 200 };

// Sthana Bala: Uchcha (exaltation) Bala — 60 at exaltation, 0 at debilitation.
function uchchaBala(planet) {
  const debil = norm360(EXALT_LON[planet.name] + 180);
  let d = Math.abs(norm360(planet.longitude - debil));
  if (d > 180) d = 360 - d;
  return (d / 180) * 60; // 0..60
}

// Saptavargaja Bala (simplified): dignity across 7 vargas → virupas.
function saptavargajaBala(kundali, name) {
  const codes = ['D1', 'D2', 'D3', 'D7', 'D9', 'D12', 'D30'];
  let total = 0;
  for (const code of codes) {
    const v = computeVarga(kundali, code);
    const p = v.planets.find((x) => x.name === name);
    const dig = getDignity(name, p.sign + 1, 15);
    if (/Exalted|Moolatrikona/.test(dig)) total += 30;
    else if (/Own/.test(dig)) total += 22.5;
    else if (/Friendly/.test(dig)) total += 15;
    else if (/Neutral/.test(dig)) total += 7.5;
    else total += 3.75;
  }
  return total / codes.length; // avg virupas
}

// Ojhayugmarasyamsa Bala: odd/even sign & navamsa preference.
function ojhaYugmaBala(kundali, name) {
  const p = kundali.planets.find((x) => x.name === name);
  const d9 = computeVarga(kundali, 'D9').planets.find((x) => x.name === name);
  const oddPref = ['Sun', 'Mars', 'Jupiter', 'Mercury', 'Saturn'].includes(name);
  let bala = 0;
  if (isOddSign(signOf(p.longitude)) === oddPref) bala += 15;
  if (isOddSign(d9.sign) === oddPref) bala += 15;
  return bala;
}

// Kendradi Bala: angular=60, succedent=30, cadent=15.
function kendradiBala(planet) {
  const h = planet.house;
  if ([1, 4, 7, 10].includes(h)) return 60;
  if ([2, 5, 8, 11].includes(h)) return 30;
  return 15;
}

// Drekkana Bala: males in 1st drekkana, etc.
function drekkanaBala(planet) {
  const part = Math.floor(degInSign(planet.longitude) / 10);
  const male = ['Sun', 'Mars', 'Jupiter'];
  const female = ['Moon', 'Venus'];
  if (part === 0 && male.includes(planet.name)) return 15;
  if (part === 2 && female.includes(planet.name)) return 15;
  if (part === 1 && ['Mercury', 'Saturn'].includes(planet.name)) return 15;
  return 0;
}

function sthanaBala(kundali, name) {
  const p = kundali.planets.find((x) => x.name === name);
  const uchcha = uchchaBala(p);
  const sapta = saptavargajaBala(kundali, name);
  const ojha = ojhaYugmaBala(kundali, name);
  const kendra = kendradiBala(p);
  const drek = drekkanaBala(p);
  const total = uchcha + sapta + ojha + kendra + drek;
  return { total, components: { uchcha, saptavargaja: sapta, ojhaYugma: ojha, kendradi: kendra, drekkana: drek } };
}

// Dig Bala: directional strength (60 at strongest direction).
const DIG_STRONG_HOUSE = { Sun: 10, Mars: 10, Jupiter: 1, Mercury: 1, Moon: 4, Venus: 4, Saturn: 7 };
function digBala(planet) {
  const strong = DIG_STRONG_HOUSE[planet.name];
  let diff = Math.abs(planet.house - strong);
  if (diff > 6) diff = 12 - diff;
  return (1 - diff / 6) * 60;
}

// Kaala Bala (analytic): Nathonnatha + Paksha + others simplified.
function kaalaBala(kundali, name) {
  const p = kundali.planets.find((x) => x.name === name);
  const sun = kundali.planets.find((x) => x.name === 'Sun');
  const moon = kundali.planets.find((x) => x.name === 'Moon');
  // Paksha Bala: benefics stronger in bright half, malefics in dark.
  let sep = Math.abs(norm360(moon.longitude - sun.longitude));
  if (sep > 180) sep = 360 - sep;
  const benefic = ['Jupiter', 'Venus', 'Mercury', 'Moon'].includes(name);
  const pakshaBenefic = (sep / 180) * 60;
  const paksha = benefic ? pakshaBenefic : 60 - pakshaBenefic;
  // Nathonnatha (day/night): approximate using Sun house (crude analytic).
  const dayPlanet = ['Sun', 'Jupiter', 'Venus'].includes(name);
  const isDay = sun.house >= 7; // crude proxy (Sun above horizon)
  const natho = (dayPlanet === isDay) ? 60 : 30;
  return { total: (paksha + natho) / 2, components: { paksha, nathonnatha: natho }, note: 'analytic model — queued for external comparison' };
}

// Cheshta Bala: motional strength (retrograde high). Simplified.
function cheshtaBala(planet) {
  if (planet.name === 'Sun' || planet.name === 'Moon') return 30; // handled via kaala/paksha classically
  return planet.isRetrograde ? 60 : 30;
}

// Naisargika Bala: fixed natural strengths (virupas /60).
const NAISARGIKA = { Sun: 60, Moon: 51.43, Venus: 42.86, Jupiter: 34.29, Mercury: 25.71, Mars: 17.14, Saturn: 8.57 };

// Drik Bala: aspectual strength (benefic aspects +, malefic −). Simplified to 0..30.
function drikBala(kundali, name) {
  const p = kundali.planets.find((x) => x.name === name);
  let bala = 0;
  for (const other of kundali.planets) {
    if (other.name === name || ['Rahu', 'Ketu'].includes(other.name)) continue;
    let sep = Math.abs(norm360(p.longitude - other.longitude));
    if (sep > 180) sep = 360 - sep;
    // 7th aspect ~180°
    if (Math.abs(sep - 180) < 6) {
      const benefic = ['Jupiter', 'Venus', 'Mercury', 'Moon'].includes(other.name);
      bala += benefic ? 10 : -10;
    }
  }
  return Math.max(-30, Math.min(30, bala));
}

/** Full Shadbala for all seven grahas. Values in Rupas (virupas/60). */
export function computeShadbala(kundali) {
  const result = {};
  // Minimum required Shadbala (in Rupas) per BPHS.
  const REQUIRED = { Sun: 5, Moon: 6, Mars: 5, Mercury: 7, Jupiter: 6.5, Venus: 5.5, Saturn: 5 };
  for (const name of SAPTA) {
    const p = kundali.planets.find((x) => x.name === name);
    const sthana = sthanaBala(kundali, name);
    const dig = digBala(p);
    const kaala = kaalaBala(kundali, name);
    const cheshta = cheshtaBala(p);
    const naisargika = NAISARGIKA[name];
    const drik = drikBala(kundali, name);
    const totalVirupa = sthana.total + dig + kaala.total + cheshta + naisargika + drik;
    const totalRupa = totalVirupa / 60;
    result[name] = {
      sthanaBala: Math.round(sthana.total * 100) / 100,
      sthanaComponents: sthana.components,
      digBala: Math.round(dig * 100) / 100,
      kaalaBala: Math.round(kaala.total * 100) / 100,
      kaalaComponents: kaala.components,
      cheshtaBala: cheshta,
      naisargikaBala: naisargika,
      drikBala: drik,
      totalVirupa: Math.round(totalVirupa * 100) / 100,
      totalRupa: Math.round(totalRupa * 100) / 100,
      required: REQUIRED[name],
      ratio: Math.round((totalRupa / REQUIRED[name]) * 100) / 100,
      isStrong: totalRupa >= REQUIRED[name],
    };
  }
  // Rank by total rupa
  const ranked = SAPTA.slice().sort((a, b) => result[b].totalRupa - result[a].totalRupa);
  return {
    convention: 'IMPLEMENTED_CONVENTION_BPHS',
    qualification: 'IMPLEMENTED — queued for external numerical comparison',
    planets: result,
    ranking: ranked,
  };
}

/** Bhava Bala — strength of each house. */
export function computeBhavaBala(kundali, shadbala) {
  const sb = shadbala || computeShadbala(kundali);
  const out = [];
  for (let h = 1; h <= 12; h++) {
    const house = kundali.houses[h - 1];
    const lord = house.lord;
    const lordBala = sb.planets[lord]?.totalRupa || 0;
    // Bhavadhipati Bala = strength of house lord.
    // Bhava Digbala by house nature (simplified).
    const digBala = [1, 4, 7, 10].includes(h) ? 60 : 30;
    // Occupant strength
    const occupants = kundali.planets.filter((p) => p.house === h && SAPTA.includes(p.name));
    const occBala = occupants.reduce((a, p) => a + (sb.planets[p.name]?.totalVirupa || 0), 0) / (occupants.length || 1);
    const total = lordBala * 60 + digBala + occBala;
    out.push({
      house: h,
      lord,
      lordStrength: lordBala,
      digBala,
      occupantStrength: Math.round(occBala * 100) / 100,
      totalVirupa: Math.round(total * 100) / 100,
      totalRupa: Math.round((total / 60) * 100) / 100,
    });
  }
  return { convention: 'IMPLEMENTED_CONVENTION_BPHS', qualification: 'IMPLEMENTED — queued for external comparison', houses: out };
}

/** Vimshopaka Bala — weighted dignity across a varga group (Shodashavarga /20). */
export function computeVimshopaka(kundali, group = 'shodasha') {
  // Shodashavarga weights summing to 20 (classical).
  const WEIGHTS = {
    shodasha: { D1: 3.5, D2: 1, D3: 1, D9: 3, D12: 0.5, D30: 1, D60: 5, D4: 0.5, D7: 0.5, D10: 0.5, D16: 2, D20: 0.5, D24: 0.5, D27: 0.5, D40: 0.5, D45: 0.5 },
    dasha: { D1: 3, D2: 1.5, D3: 1.5, D7: 1.5, D9: 1.5, D10: 1.5, D12: 1.5, D16: 1.5, D30: 1.5, D60: 5 },
    sapta: { D1: 5, D2: 2, D3: 3, D7: 2.5, D9: 4.5, D12: 2, D30: 1 },
  };
  const w = WEIGHTS[group] || WEIGHTS.shodasha;
  const out = {};
  for (const name of SAPTA) {
    let score = 0;
    let wsum = 0;
    for (const [code, weight] of Object.entries(w)) {
      const v = computeVarga(kundali, code);
      const p = v.planets.find((x) => x.name === name);
      const dig = getDignity(name, p.sign + 1, 15);
      let f = 0.25;
      if (/Exalted|Moolatrikona/.test(dig)) f = 1;
      else if (/Own/.test(dig)) f = 0.85;
      else if (/Friendly/.test(dig)) f = 0.6;
      else if (/Neutral/.test(dig)) f = 0.4;
      score += weight * f;
      wsum += weight;
    }
    out[name] = Math.round((score / wsum) * 20 * 100) / 100; // 0..20
  }
  return { convention: 'IMPLEMENTED_CONVENTION_BPHS', group, qualification: 'IMPLEMENTED — queued for external comparison', planets: out };
}

/** Ishta & Kashta Phala from Uchcha + Cheshta bala. */
export function computeIshtaKashta(kundali) {
  const out = {};
  for (const name of SAPTA) {
    const p = kundali.planets.find((x) => x.name === name);
    const uchcha = uchchaBala(p);
    const cheshta = cheshtaBala(p);
    const ishta = Math.sqrt(uchcha * cheshta);
    const kashta = Math.sqrt((60 - uchcha) * (60 - cheshta));
    out[name] = { ishta: Math.round(ishta * 100) / 100, kashta: Math.round(kashta * 100) / 100 };
  }
  return { convention: 'IMPLEMENTED_CONVENTION_BPHS', planets: out };
}

export default { computeShadbala, computeBhavaBala, computeVimshopaka, computeIshtaKashta };
