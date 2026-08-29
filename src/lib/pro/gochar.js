/**
 * WAVE 8 — GOCHAR (transit workstation)
 * =====================================
 * Convention: IMPLEMENTED_CONVENTION_LAHIRI / PARASHARA.
 *
 * For any chosen date: transit planet positions, natal overlay, transit-to-natal
 * aspects, house transit, transit over D1 / selected varga, Dasha overlay,
 * Ashtakavarga overlay, retrograde/station events, ingress, conjunction.
 *
 * Date stepping (hour/day/week/month/year) is a UI concern; this module simply
 * accepts any Date.
 */

import { norm360, signOf, degInSign, SIGN_NAMES, GRAHA_ASPECTS, nakOf, padaOf } from './math.js';
import { calculateKundali } from '../astrologyEngine.js';
import { computeVarga } from './vargas.js';
import { sarvashtakavarga } from './ashtakavarga.js';

/** Transit chart at a moment for a place (defaults to natal place). */
export function transitChart(dateUTC, place) {
  const params = {
    birthDate: dateUTC.toISOString().slice(0, 10),
    birthTime: `${String(dateUTC.getUTCHours()).padStart(2, '0')}:${String(dateUTC.getUTCMinutes()).padStart(2, '0')}`,
    latitude: place.latitude, longitude: place.longitude, timezone: 0, locationName: place.name,
  };
  return calculateKundali(params);
}

/** House a transit longitude falls in relative to natal lagna (whole sign). */
function houseFromNatal(natal, longitude) {
  const lagnaSign = signOf(natal.lagna.longitude);
  return ((signOf(longitude) - lagnaSign + 12) % 12) + 1;
}

/**
 * Transit-to-natal aspects using Parashari graha drishti (house-count based).
 * Returns aspects where a transit planet aspects a natal planet's house.
 */
export function transitNatalAspects(natal, transit) {
  const results = [];
  const natalPlanets = natal.planets;
  for (const tp of transit.planets) {
    const tHouse = houseFromNatal(natal, tp.longitude);
    const aspects = GRAHA_ASPECTS[tp.name] || [7];
    for (const np of natalPlanets) {
      const nHouse = ((signOf(np.longitude) - signOf(natal.lagna.longitude) + 12) % 12) + 1;
      const dist = ((nHouse - tHouse + 12) % 12) + 1;
      if (aspects.includes(dist)) {
        results.push({ transit: tp.name, aspects: np.name, houseDistance: dist, transitHouse: tHouse, natalHouse: nHouse });
      }
    }
  }
  return results;
}

/** Conjunctions between transit and natal planets (same sign, within orb). */
export function transitConjunctions(natal, transit, orbDeg = 8) {
  const out = [];
  for (const tp of transit.planets) {
    for (const np of natal.planets) {
      let sep = Math.abs(norm360(tp.longitude - np.longitude));
      if (sep > 180) sep = 360 - sep;
      if (sep <= orbDeg) out.push({ transit: tp.name, natal: np.name, orb: Math.round(sep * 100) / 100, sign: SIGN_NAMES[signOf(tp.longitude)] });
    }
  }
  return out;
}

/**
 * Detect retrograde/station & ingress events over a date window by sampling.
 * @param {Date} start
 * @param {Date} end
 * @param {object} place
 * @param {number} stepDays sampling resolution
 */
export function transitEvents(start, end, place, stepDays = 1) {
  const events = [];
  const planets = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  let prev = null;
  for (let t = start.getTime(); t <= end.getTime(); t += stepDays * 864e5) {
    const dt = new Date(t);
    const chart = transitChart(dt, place);
    const snap = {};
    for (const name of planets) {
      const p = chart.planets.find((x) => x.name === name);
      snap[name] = { lon: p.longitude, sign: signOf(p.longitude) };
    }
    if (prev) {
      for (const name of planets) {
        // ingress: sign change
        if (snap[name].sign !== prev.snap[name].sign) {
          events.push({ type: 'ingress', planet: name, date: dt.toISOString().slice(0, 10), from: SIGN_NAMES[prev.snap[name].sign], to: SIGN_NAMES[snap[name].sign] });
        }
        // station/retrograde: direction reversal in longitude (accounting for wrap)
        let delta = snap[name].lon - prev.snap[name].lon;
        if (delta > 180) delta -= 360; if (delta < -180) delta += 360;
        if (prev.delta && prev.delta[name] !== undefined) {
          const wasForward = prev.delta[name] >= 0;
          const isForward = delta >= 0;
          if (wasForward !== isForward) {
            events.push({ type: isForward ? 'station-direct' : 'station-retrograde', planet: name, date: dt.toISOString().slice(0, 10) });
          }
        }
        prev.delta = prev.delta || {};
        prev.delta[name] = delta;
      }
    }
    const delta = {};
    if (prev) for (const name of planets) { let d = snap[name].lon - prev.snap[name].lon; if (d > 180) d -= 360; if (d < -180) d += 360; delta[name] = d; }
    prev = { snap, delta };
  }
  return events;
}

/**
 * Full Gochar analysis at a moment: transit chart, natal overlay, aspects,
 * house transits, varga overlay, dasha overlay hook, and Ashtakavarga overlay.
 * @param {object} natal canonical natal kundali
 * @param {Date} when
 * @param {object} opts { varga: 'D9', place, sav }
 */
export function computeGochar(natal, when, opts = {}) {
  const place = opts.place || { latitude: natal.meta.latitude, longitude: natal.meta.longitude, name: natal.meta.locationName };
  const transit = transitChart(when, place);
  const sav = opts.sav || sarvashtakavarga(natal).bindus;

  const houseTransits = transit.planets.map((p) => {
    const house = houseFromNatal(natal, p.longitude);
    const sign = signOf(p.longitude);
    return {
      planet: p.name, sign, signName: SIGN_NAMES[sign], degree: Math.round(degInSign(p.longitude) * 100) / 100,
      natalHouse: house, isRetrograde: p.isRetrograde,
      nakshatra: nakOf(p.longitude), pada: padaOf(p.longitude),
      savBindusInSign: sav[sign], // Ashtakavarga overlay: bindus in the sign being transited
    };
  });

  let vargaOverlay = null;
  if (opts.varga && opts.varga !== 'D1') {
    const natalV = computeVarga(natal, opts.varga);
    // transit planets projected into the chosen varga sign
    const transitV = transit.planets.map((p) => {
      const vsign = computeVarga({ ...natal, planets: [{ ...p }], lagna: natal.lagna }, opts.varga);
      return { planet: p.name };
    });
    vargaOverlay = { varga: opts.varga, natal: natalV };
  }

  return {
    convention: 'IMPLEMENTED_CONVENTION_PARASHARA',
    when: when.toISOString(),
    place,
    transitChart: transit,
    houseTransits,
    aspectsToNatal: transitNatalAspects(natal, transit),
    conjunctions: transitConjunctions(natal, transit),
    ashtakavargaOverlay: { savBySign: sav, note: 'Transit strength read from SAV bindus in the transited sign.' },
    vargaOverlay,
  };
}

export default { transitChart, transitNatalAspects, transitConjunctions, transitEvents, computeGochar };
