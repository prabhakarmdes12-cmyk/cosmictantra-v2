/**
 * WAVE 5 — VARSHAPHALA (TAJIKA / annual chart)
 * ============================================
 * Convention: IMPLEMENTED_CONVENTION_TAJIKA.
 * Return location MAY differ from birthplace.
 *
 *   Solar Return (Varsha Pravesh), Muntha, Varshesha, Panchadhikari,
 *   Panchavargeeya Bala, Harsha Bala, Tajika aspects & Yogas, Sahams,
 *   Mudda Dasha, Patyayini Dasha, monthly & daily charts.
 */

import { norm360, signOf, degInSign, SIGN_NAMES, SIGN_LORDS, addSigns, countSigns } from './math.js';
import { calculateKundali } from '../astrologyEngine.js';

/**
 * Find the solar-return moment for a given year: the instant the Sun returns to
 * its exact natal sidereal longitude. We search day-by-day around the birthday
 * then refine, computing charts via the canonical engine.
 */
export function solarReturnChart(birthParams, year, returnLocation) {
  const natal = calculateKundali(birthParams);
  const natalSunLon = natal.planets.find((p) => p.name === 'Sun').longitude;
  const loc = returnLocation || {
    latitude: birthParams.latitude, longitude: birthParams.longitude,
    timezone: birthParams.timezone, locationName: birthParams.locationName,
  };
  const [, bm, bd] = String(birthParams.birthDate).split('-').map(Number);

  // Coarse search: scan ±3 days around the birthday at hourly resolution.
  let best = null;
  const baseDate = new Date(Date.UTC(year, bm - 1, bd, 0, 0, 0));
  for (let hOffset = -72; hOffset <= 72; hOffset++) {
    const dt = new Date(baseDate.getTime() + hOffset * 3600 * 1000);
    const params = {
      birthDate: dt.toISOString().slice(0, 10),
      birthTime: `${String(dt.getUTCHours()).padStart(2, '0')}:${String(dt.getUTCMinutes()).padStart(2, '0')}`,
      latitude: loc.latitude, longitude: loc.longitude, timezone: 0, locationName: loc.locationName,
    };
    const k = calculateKundali(params);
    const sunLon = k.planets.find((p) => p.name === 'Sun').longitude;
    let diff = Math.abs(norm360(sunLon - natalSunLon));
    if (diff > 180) diff = 360 - diff;
    if (!best || diff < best.diff) best = { diff, params, dt, chart: k };
  }
  // refine to the minute
  for (let mOffset = -60; mOffset <= 60; mOffset++) {
    const dt = new Date(best.dt.getTime() + mOffset * 60 * 1000);
    const params = {
      birthDate: dt.toISOString().slice(0, 10),
      birthTime: `${String(dt.getUTCHours()).padStart(2, '0')}:${String(dt.getUTCMinutes()).padStart(2, '0')}`,
      latitude: loc.latitude, longitude: loc.longitude, timezone: 0, locationName: loc.locationName,
    };
    const k = calculateKundali(params);
    const sunLon = k.planets.find((p) => p.name === 'Sun').longitude;
    let diff = Math.abs(norm360(sunLon - natalSunLon));
    if (diff > 180) diff = 360 - diff;
    if (diff < best.diff) best = { diff, params, dt, chart: k };
  }

  return {
    convention: 'IMPLEMENTED_CONVENTION_TAJIKA',
    year,
    returnMomentUTC: best.dt.toISOString(),
    returnLocation: loc,
    natalSunLongitude: Math.round(natalSunLon * 100) / 100,
    matchError: Math.round(best.diff * 3600) / 3600 + '°',
    chart: best.chart,
  };
}

/** Muntha: natal lagna sign advanced 1 sign per year of age. */
export function muntha(natal, ageYears) {
  const lagnaSign = signOf(natal.lagna.longitude);
  const sign = addSigns(lagnaSign, ageYears % 12);
  return { sign, signName: SIGN_NAMES[sign], lord: SIGN_LORDS[sign], age: ageYears };
}

/**
 * Panchavargeeya Bala for the year lord candidates and Harsha Bala.
 * Simplified Tajika strengths (0..20 each). Used to pick Varshesha.
 */
export function panchavargeeyaBala(varshaChart) {
  const out = {};
  for (const name of ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']) {
    const p = varshaChart.planets.find((x) => x.name === name);
    // Grahoccha + Hadda + Drekkana + Navamsa + Kendra components (simplified)
    const kendra = [1, 4, 7, 10].includes(p.house) ? 5 : [2, 5, 8, 11].includes(p.house) ? 3 : 1;
    const bala = kendra + (p.dignity && /Exalted|Own|Moolatrikona/.test(p.dignity) ? 8 : /Friendly/.test(p.dignity) ? 4 : 2);
    out[name] = bala;
  }
  return out;
}

/** Harsha Bala — joy strength by house & day/night & dignity. */
export function harshaBala(varshaChart) {
  const out = {};
  const JOY_HOUSE = { Sun: 9, Moon: 3, Mars: 6, Mercury: 1, Jupiter: 11, Venus: 5, Saturn: 12 };
  for (const name of ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']) {
    const p = varshaChart.planets.find((x) => x.name === name);
    let bala = 0;
    if (p.house === JOY_HOUSE[name]) bala += 5;
    if (/Exalted|Own|Moolatrikona/.test(p.dignity || '')) bala += 5;
    out[name] = bala;
  }
  return out;
}

/**
 * Varshesha (year lord) — chosen among 5 Panchadhikari candidates:
 * Muntha lord, Lagna lord, Sun-sign lord, Moon-sign lord, Trirashipati.
 * The strongest by Panchavargeeya Bala becomes Varshesha.
 */
export function varshesha(natal, varshaChart, ageYears) {
  const mun = muntha(natal, ageYears);
  const lagnaLord = SIGN_LORDS[signOf(varshaChart.lagna.longitude)];
  const sunLord = SIGN_LORDS[signOf(varshaChart.planets.find((p) => p.name === 'Sun').longitude)];
  const moonLord = SIGN_LORDS[signOf(varshaChart.planets.find((p) => p.name === 'Moon').longitude)];
  // Trirashipati: lord of the sign forming the "muntha trine" — use muntha lord as proxy candidate.
  const candidates = Array.from(new Set([mun.lord, lagnaLord, sunLord, moonLord]));
  const pv = panchavargeeyaBala(varshaChart);
  const ranked = candidates.slice().sort((a, b) => (pv[b] || 0) - (pv[a] || 0));
  return {
    panchadhikari: { munthaLord: mun.lord, lagnaLord, sunSignLord: sunLord, moonSignLord: moonLord },
    candidateStrengths: Object.fromEntries(candidates.map((c) => [c, pv[c] || 0])),
    varshesha: ranked[0],
  };
}

/**
 * Sahams (sensitive points). Punya Saham = Moon − Sun + Lagna (day birth);
 * others follow classical formulae. Returns a set of the common sahams.
 */
export function sahams(varshaChart) {
  const lon = (n) => varshaChart.planets.find((p) => p.name === n).longitude;
  const asc = varshaChart.lagna.longitude;
  const sun = lon('Sun'); const moon = lon('Moon');
  const venus = lon('Venus'); const jup = lon('Jupiter'); const sat = lon('Saturn'); const mars = lon('Mars');
  const mk = (v) => { const x = norm360(v); return { longitude: Math.round(x * 100) / 100, sign: signOf(x), signName: SIGN_NAMES[signOf(x)] }; };
  return {
    convention: 'IMPLEMENTED_CONVENTION_TAJIKA (day-birth formulae)',
    punya: mk(moon - sun + asc),
    vidya: mk(sun - moon + asc),
    yasas: mk(jup - sun + asc),
    mitra: mk(jup - sat + asc),
    karma: mk(mars - moon + asc),
    roga: mk(asc - moon + sat),
    kali: mk(jup - mars + asc),
    vivaha: mk(venus - sat + asc),
    putra: mk(jup - moon + asc),
    artha: mk(sun - venus + asc),
  };
}

/**
 * Tajika aspects (Ithasala, Ishrafa, etc.) between two planets by orb of
 * exact aspect (0/60/90/120/180). Ithasala = applying (faster approaching
 * slower); Ishrafa = separating.
 */
export function tajikaAspects(varshaChart) {
  const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const speed = { Moon: 13.2, Mercury: 1.4, Venus: 1.2, Sun: 1.0, Mars: 0.5, Jupiter: 0.08, Saturn: 0.03 };
  const aspects = [];
  const targets = [0, 60, 90, 120, 180];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = varshaChart.planets.find((p) => p.name === planets[i]);
      const b = varshaChart.planets.find((p) => p.name === planets[j]);
      let sep = Math.abs(norm360(a.longitude - b.longitude));
      if (sep > 180) sep = 360 - sep;
      for (const t of targets) {
        if (Math.abs(sep - t) <= 6) {
          const faster = speed[planets[i]] >= speed[planets[j]] ? planets[i] : planets[j];
          aspects.push({
            between: [planets[i], planets[j]], aspect: t, orb: Math.round(Math.abs(sep - t) * 100) / 100,
            type: sep < t ? 'Ithasala (applying)' : 'Ishrafa (separating)', faster,
          });
        }
      }
    }
  }
  return { convention: 'IMPLEMENTED_CONVENTION_TAJIKA', aspects };
}

/** Tajika Yogas (subset: Ithasala/Ishrafa/Nakta/Yamaya) derived from aspects. */
export function tajikaYogas(varshaChart) {
  const asp = tajikaAspects(varshaChart).aspects;
  const yogas = [];
  for (const a of asp) {
    if (a.type.startsWith('Ithasala')) yogas.push({ yoga: 'Ithasala', planets: a.between, meaning: 'Union / promise fulfilled', aspect: a.aspect });
    if (a.type.startsWith('Ishrafa')) yogas.push({ yoga: 'Ishrafa', planets: a.between, meaning: 'Separation / promise fading', aspect: a.aspect });
  }
  return { convention: 'IMPLEMENTED_CONVENTION_TAJIKA', yogas };
}

/**
 * Mudda Dasha (Vimshottari proportion compressed into the solar year = 365.25d).
 * Patyayini Dasha (based on planetary longitudes/strength over the year).
 */
export function muddaDasha(varshaChart, returnMomentUTC) {
  const VIM = [['Ketu', 7], ['Venus', 20], ['Sun', 6], ['Moon', 10], ['Mars', 7], ['Rahu', 18], ['Jupiter', 16], ['Saturn', 19], ['Mercury', 17]];
  const moonNak = Math.floor(((varshaChart.moon.longitude % 360) + 360) % 360 / (360 / 27));
  const startIdx = moonNak % 9;
  const yearDays = 365.25;
  let cursor = new Date(returnMomentUTC);
  const periods = [];
  for (let i = 0; i < 9; i++) {
    const [lord, yrs] = VIM[(startIdx + i) % 9];
    const days = (yrs / 120) * yearDays;
    const start = new Date(cursor);
    const end = new Date(cursor.getTime() + days * 864e5);
    periods.push({ lord, days: Math.round(days * 100) / 100, start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) });
    cursor = end;
  }
  return { convention: 'IMPLEMENTED_CONVENTION_TAJIKA', periods };
}

export function patyayiniDasha(varshaChart, returnMomentUTC) {
  // Order planets + lagna by longitude within their sign; allocate the year by
  // remaining arc to next boundary (simplified deterministic Patyayini).
  const pts = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].map((n) => {
    const p = varshaChart.planets.find((x) => x.name === n);
    return { lord: n, deg: degInSign(p.longitude) };
  });
  pts.sort((a, b) => a.deg - b.deg);
  const totalWeight = pts.reduce((s, p) => s + (30 - p.deg), 0) || 1;
  let cursor = new Date(returnMomentUTC);
  const periods = pts.map((p) => {
    const days = ((30 - p.deg) / totalWeight) * 365.25;
    const start = new Date(cursor);
    const end = new Date(cursor.getTime() + days * 864e5);
    cursor = end;
    return { lord: p.lord, days: Math.round(days * 100) / 100, start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  });
  return { convention: 'IMPLEMENTED_CONVENTION_TAJIKA', periods };
}

/** Monthly chart = solar-return chart advanced ~30.4 days (Sun +~30° per month). */
export function monthlyCharts(birthParams, year, returnLocation) {
  const sr = solarReturnChart(birthParams, year, returnLocation);
  const start = new Date(sr.returnMomentUTC);
  const loc = sr.returnLocation;
  const months = [];
  for (let mi = 0; mi < 12; mi++) {
    const dt = new Date(start.getTime() + mi * 30.4375 * 864e5);
    const params = {
      birthDate: dt.toISOString().slice(0, 10),
      birthTime: `${String(dt.getUTCHours()).padStart(2, '0')}:${String(dt.getUTCMinutes()).padStart(2, '0')}`,
      latitude: loc.latitude, longitude: loc.longitude, timezone: 0, locationName: loc.locationName,
    };
    months.push({ month: mi + 1, momentUTC: dt.toISOString(), chart: calculateKundali(params) });
  }
  return { convention: 'IMPLEMENTED_CONVENTION_TAJIKA', months };
}

/** Daily (Dina) chart for a specific day within the year. */
export function dailyChart(birthParams, dateISO, returnLocation) {
  const loc = returnLocation || birthParams;
  const dt = new Date(`${dateISO}T00:00:00Z`);
  const params = {
    birthDate: dateISO, birthTime: '00:00',
    latitude: loc.latitude, longitude: loc.longitude, timezone: 0, locationName: loc.locationName,
  };
  return { convention: 'IMPLEMENTED_CONVENTION_TAJIKA', date: dateISO, chart: calculateKundali(params) };
}

/** Complete Varshaphala bundle for a birth + year. */
export function computeVarshaphala(birthParams, year, returnLocation) {
  const natal = calculateKundali(birthParams);
  const sr = solarReturnChart(birthParams, year, returnLocation);
  const [by] = String(birthParams.birthDate).split('-').map(Number);
  const age = year - by;
  return {
    convention: 'IMPLEMENTED_CONVENTION_TAJIKA',
    year,
    age,
    solarReturn: sr,
    muntha: muntha(natal, age),
    varshesha: varshesha(natal, sr.chart, age),
    panchavargeeyaBala: panchavargeeyaBala(sr.chart),
    harshaBala: harshaBala(sr.chart),
    sahams: sahams(sr.chart),
    tajikaAspects: tajikaAspects(sr.chart),
    tajikaYogas: tajikaYogas(sr.chart),
    muddaDasha: muddaDasha(sr.chart, sr.returnMomentUTC),
    patyayiniDasha: patyayiniDasha(sr.chart, sr.returnMomentUTC),
  };
}

export default {
  solarReturnChart, muntha, panchavargeeyaBala, harshaBala, varshesha, sahams,
  tajikaAspects, tajikaYogas, muddaDasha, patyayiniDasha, monthlyCharts, dailyChart, computeVarshaphala,
};
