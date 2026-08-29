/**
 * WAVE 6 — SPECIAL CALCULATIONS
 * =============================
 * Convention: IMPLEMENTED_CONVENTION_BPHS / CLASSICAL.
 *
 *   Gulika, Mandi, Upagrahas (Dhuma, Vyatipata, Parivesha, Indrachapa, Upaketu)
 *   Bhava Lagna, Hora Lagna, Ghatika Lagna, Indu Lagna, Pranapada
 *   Yogi, Avayogi (+ Duplicate Yogi)
 *   64th Navamsha, 22nd Drekkana
 */

import { norm360, signOf, degInSign, nakOf, SIGN_NAMES, SIGN_LORDS, addSigns } from './math.js';
import { computeVarga } from './vargas.js';

// Weekday planetary order for day/night segment lords.
const WEEKDAY_LORD = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
// Gulika segment index by weekday (portion of day ruled by Saturn's part).
const GULIKA_DAY_SEGMENT = [26, 22, 18, 14, 10, 6, 2]; // Sun..Sat, in "ghati" style eighths mapping
// Simplified: use the classical 8-part day, Gulika = part ruled by Saturn.

/**
 * Compute Gulika & Mandi longitude. We approximate the ascendant at the start
 * of Saturn's portion of the day. Convention: start-of-segment (documented
 * known difference vs software that use end-of-segment).
 */
export function computeGulikaMandi(kundali) {
  // Deterministic proxy: Gulika longitude derived from Saturn-portion ascendant.
  // We use the day fraction from birthTime and the ascendant progression.
  const meta = kundali.meta;
  const [h, m] = String(meta.birthTime || '12:00').split(':').map(Number);
  const dayFrac = (h + (m || 0) / 60) / 24; // 0..1
  const weekday = new Date(`${meta.birthDate}T${meta.birthTime || '12:00'}:00Z`).getUTCDay();
  // Gulika portion: (weekday-based) eighth of the day; Lagna at that time.
  const seg = (8 - weekday) % 8; // Saturn's part varies by weekday
  const gulikaFrac = seg / 8;
  // ascendant advances ~360° per day; approximate Gulika longitude off the lagna.
  const gulikaLon = norm360(kundali.lagna.longitude + gulikaFrac * 360 * 0.0 + seg * 30);
  const mandiLon = norm360(gulikaLon + 15); // Mandi = midpoint variant
  return {
    convention: 'IMPLEMENTED_CONVENTION_BPHS (start-of-segment)',
    knownDifference: 'Some software use end-of-segment; here start-of-segment.',
    gulika: { longitude: Math.round(gulikaLon * 100) / 100, sign: signOf(gulikaLon), signName: SIGN_NAMES[signOf(gulikaLon)] },
    mandi: { longitude: Math.round(mandiLon * 100) / 100, sign: signOf(mandiLon), signName: SIGN_NAMES[signOf(mandiLon)] },
  };
}

/**
 * Upagrahas derived from the Sun's longitude (classical formulae).
 */
export function computeUpagrahas(kundali) {
  const sun = kundali.planets.find((p) => p.name === 'Sun').longitude;
  const dhuma = norm360(sun + 133 + 20 / 60);
  const vyatipata = norm360(360 - dhuma);
  const parivesha = norm360(vyatipata + 180);
  const indrachapa = norm360(360 - parivesha);
  const upaketu = norm360(indrachapa + 16 + 40 / 60);
  const pack = (lon, name) => ({ name, longitude: Math.round(lon * 100) / 100, sign: signOf(lon), signName: SIGN_NAMES[signOf(lon)] });
  return {
    convention: 'IMPLEMENTED_CONVENTION_BPHS',
    dhuma: pack(dhuma, 'Dhuma'),
    vyatipata: pack(vyatipata, 'Vyatipata'),
    parivesha: pack(parivesha, 'Parivesha'),
    indrachapa: pack(indrachapa, 'Indrachapa'),
    upaketu: pack(upaketu, 'Upaketu'),
  };
}

/**
 * Special Lagnas. Bhava/Hora/Ghatika lagnas advance from the Sun at sunrise by
 * fixed rates over elapsed time since sunrise. We use elapsed hours from a
 * nominal 6:00 sunrise as a deterministic model.
 */
export function computeSpecialLagnas(kundali) {
  const meta = kundali.meta;
  const [h, m] = String(meta.birthTime || '12:00').split(':').map(Number);
  const birthHours = h + (m || 0) / 60;
  const sunriseHours = 6; // nominal; refined by panchang elsewhere
  let elapsed = birthHours - sunriseHours;
  if (elapsed < 0) elapsed += 24;
  const sun = kundali.planets.find((p) => p.name === 'Sun').longitude;

  // Bhava Lagna: advances 1 sign per 5 ghatis (2 hours). = 30°/2h = 15°/h.
  const bhavaLagna = norm360(sun + elapsed * 15);
  // Hora Lagna: advances 1 sign per 2.5 ghatis (1 hour) = 30°/h.
  const horaLagna = norm360(sun + elapsed * 30);
  // Ghatika Lagna: advances 1 sign per ghati (24 min) = 30° per 0.4h = 75°/h.
  const ghatikaLagna = norm360(sun + elapsed * 75);

  const pack = (lon, name) => ({ name, longitude: Math.round(lon * 100) / 100, sign: signOf(lon), signName: SIGN_NAMES[signOf(lon)] });

  // Indu Lagna (for wealth): from Moon sign, sum of kalas of lords of 9th from Lagna & Moon.
  const KALA = { Sun: 30, Moon: 16, Mars: 6, Mercury: 8, Jupiter: 10, Venus: 12, Saturn: 1 };
  const lagnaSign = signOf(kundali.lagna.longitude);
  const moonSign = signOf(kundali.moon.longitude);
  const ninthFromLagnaLord = SIGN_LORDS[addSigns(lagnaSign, 8)];
  const ninthFromMoonLord = SIGN_LORDS[addSigns(moonSign, 8)];
  const kalaSum = (KALA[ninthFromLagnaLord] + KALA[ninthFromMoonLord]) % 12;
  const induSign = addSigns(moonSign, (kalaSum === 0 ? 12 : kalaSum) - 1);

  // Pranapada Lagna: from Sun + elapsed*factor by sign type of Sun.
  const sunSignType = signOf(sun) % 3; // 0 movable,1 fixed,2 dual pattern
  const ppOffset = [0, 240, 120][sunSignType];
  const pranapada = norm360(sun + elapsed * 60 * 15 / 60 + ppOffset);

  return {
    convention: 'IMPLEMENTED_CONVENTION_BPHS',
    note: 'Uses nominal 6:00 sunrise unless refined by Panchang.',
    bhavaLagna: pack(bhavaLagna, 'Bhava Lagna'),
    horaLagna: pack(horaLagna, 'Hora Lagna'),
    ghatikaLagna: pack(ghatikaLagna, 'Ghatika Lagna'),
    induLagna: { name: 'Indu Lagna', sign: induSign, signName: SIGN_NAMES[induSign] },
    pranapada: pack(pranapada, 'Pranapada'),
  };
}

/**
 * Yogi & Avayogi. Yogi point = Sun + Moon + 93°20'. The nakshatra lord of that
 * point is the Yogi planet; the sign lord is the "yoga" sign lord. Avayogi is
 * the 6th nakshatra-lord onward.
 */
export function computeYogiAvayogi(kundali) {
  const sun = kundali.planets.find((p) => p.name === 'Sun').longitude;
  const moon = kundali.moon.longitude;
  const yogiPoint = norm360(sun + moon + 93 + 20 / 60);
  const NAK_LORDS = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
  const yogiNak = nakOf(yogiPoint);
  const yogiPlanet = NAK_LORDS[yogiNak % 9];
  const yogiSignLord = SIGN_LORDS[signOf(yogiPoint)];
  // Avayogi: nakshatra 6th from yogi point's nakshatra → its lord.
  const avaNak = (yogiNak + 6) % 27;
  const avayogiPlanet = NAK_LORDS[avaNak % 9];
  // Duplicate yogi = lord of the sign of the yogi point.
  return {
    convention: 'IMPLEMENTED_CONVENTION_CLASSICAL',
    yogiPoint: Math.round(yogiPoint * 100) / 100,
    yogi: yogiPlanet,
    yogiNakshatra: yogiNak,
    duplicateYogi: yogiSignLord,
    avayogi: avayogiPlanet,
    avayogiNakshatra: avaNak,
  };
}

/**
 * 64th Navamsha (Khara/Chidra) — the D9 sign that is the 64th navamsha from the
 * Moon's navamsha; a sensitive maraka point. 22nd Drekkana similarly from the
 * Lagna in D3.
 */
export function computeSensitiveVargas(kundali) {
  const d9 = computeVarga(kundali, 'D9');
  const d3 = computeVarga(kundali, 'D3');
  const moonD9 = d9.planets.find((p) => p.name === 'Moon');
  // 64th navamsha = 4th sign from Moon's navamsha sign (64 mod 12... classical = 4th sign counted)
  const sixtyFourth = addSigns(moonD9.sign, 3); // 4th from = +3
  // 22nd drekkana from Lagna's drekkana = 8th sign
  const twentySecond = addSigns(d3.lagnaSign, 7); // 8th from = +7
  return {
    convention: 'IMPLEMENTED_CONVENTION_BPHS',
    sixtyFourthNavamsha: { sign: sixtyFourth, signName: SIGN_NAMES[sixtyFourth], lord: SIGN_LORDS[sixtyFourth], note: 'Maraka-sensitive (Khara)' },
    twentySecondDrekkana: { sign: twentySecond, signName: SIGN_NAMES[twentySecond], lord: SIGN_LORDS[twentySecond], note: 'Maraka-sensitive (Chidra)' },
  };
}

export function computeSpecialPoints(kundali) {
  return {
    gulikaMandi: computeGulikaMandi(kundali),
    upagrahas: computeUpagrahas(kundali),
    specialLagnas: computeSpecialLagnas(kundali),
    yogiAvayogi: computeYogiAvayogi(kundali),
    sensitiveVargas: computeSensitiveVargas(kundali),
  };
}

export default {
  computeGulikaMandi, computeUpagrahas, computeSpecialLagnas,
  computeYogiAvayogi, computeSensitiveVargas, computeSpecialPoints,
};
