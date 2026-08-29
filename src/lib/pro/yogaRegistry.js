/**
 * WAVE 10 — YOGA / DOSHA RULE SYSTEM (registry, not hardcoded UI conditions)
 * =========================================================================
 * Every Yoga/Dosha declares: source, tradition, conditions, cancellation,
 * applicable chart, evidence, and detected/not-detected at evaluation time.
 *
 * We implement classical rules in TRACEABLE BATCHES. We do NOT manufacture a
 * marketing "500 Yogas" target.
 */

import { signOf, degInSign, SIGN_LORDS, addSigns } from './math.js';
import { getDignity } from '../astrologyEngine.js';

// helpers over a canonical kundali
function planet(k, name) { return k.planets.find((p) => p.name === name); }
function houseOf(k, name) { return planet(k, name).house; }
function lordOfHouse(k, houseNum) {
  const lagnaSign = signOf(k.lagna.longitude);
  const sign = addSigns(lagnaSign, houseNum - 1);
  return SIGN_LORDS[sign];
}
function planetsInHouse(k, houseNum) { return k.planets.filter((p) => p.house === houseNum).map((p) => p.name); }
function isKendra(h) { return [1, 4, 7, 10].includes(h); }
function isTrikona(h) { return [1, 5, 9].includes(h); }
function dignityOf(k, name) {
  const p = planet(k, name);
  return getDignity(name, signOf(p.longitude) + 1, degInSign(p.longitude));
}

/**
 * A rule: { id, name, family('Yoga'|'Dosha'), source, tradition, applicableChart,
 *           conditions(text), cancellation(text), detect(kundali) -> {detected, evidence[]} }
 */
export const RULES = [
  // ── Pancha Mahapurusha Yogas ──────────────────────────────────────────────
  ...['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].map((pl) => {
    const names = { Mars: 'Ruchaka', Mercury: 'Bhadra', Jupiter: 'Hamsa', Venus: 'Malavya', Saturn: 'Shasha' };
    return {
      id: `mahapurusha.${pl.toLowerCase()}`,
      name: `${names[pl]} Yoga`,
      family: 'Yoga',
      source: 'BPHS / Phaladeepika',
      tradition: 'Parashari',
      applicableChart: 'D1',
      conditions: `${pl} in own sign or exaltation AND in a Kendra (1/4/7/10) from Lagna.`,
      cancellation: 'Combustion or debilitation elsewhere can dilute results.',
      detect: (k) => {
        const p = planet(k, pl);
        const dig = dignityOf(k, pl);
        const inDignity = /Exalted|Own|Moolatrikona/.test(dig);
        const inKendra = isKendra(p.house);
        const detected = inDignity && inKendra;
        return { detected, evidence: [`${pl} dignity=${dig}`, `${pl} house=${p.house} (kendra=${inKendra})`] };
      },
    };
  }),

  // ── Raja Yogas (batch 1) ──────────────────────────────────────────────────
  {
    id: 'raja.kendra_trikona',
    name: 'Kendra-Trikona Raja Yoga',
    family: 'Yoga', source: 'BPHS', tradition: 'Parashari', applicableChart: 'D1',
    conditions: 'A Kendra lord and a Trikona lord conjoin, aspect, or exchange.',
    cancellation: 'If involved lords are debilitated/combust without cancellation.',
    detect: (k) => {
      const kendraLords = new Set([1, 4, 7, 10].map((h) => lordOfHouse(k, h)));
      const trikonaLords = new Set([1, 5, 9].map((h) => lordOfHouse(k, h)));
      // conjunction: a kendra lord and trikona lord in same house (and not the same planet)
      const ev = [];
      let detected = false;
      for (let h = 1; h <= 12; h++) {
        const occ = planetsInHouse(k, h);
        const kl = occ.filter((n) => kendraLords.has(n));
        const tl = occ.filter((n) => trikonaLords.has(n));
        for (const a of kl) for (const b of tl) {
          if (a !== b) { detected = true; ev.push(`${a} (kendra lord) + ${b} (trikona lord) conjoin in house ${h}`); }
        }
      }
      return { detected, evidence: ev.length ? ev : ['No kendra-trikona lord conjunction found'] };
    },
  },
  {
    id: 'yoga.gajakesari',
    name: 'Gaja Kesari Yoga',
    family: 'Yoga', source: 'Phaladeepika', tradition: 'Parashari', applicableChart: 'D1',
    conditions: 'Jupiter in a Kendra (1/4/7/10) from the Moon.',
    cancellation: 'Weak/combust Jupiter reduces effect.',
    detect: (k) => {
      const jup = planet(k, 'Jupiter');
      const moonSign = signOf(k.moon.longitude);
      const jupSign = signOf(jup.longitude);
      const dist = ((jupSign - moonSign + 12) % 12) + 1;
      const detected = [1, 4, 7, 10].includes(dist);
      return { detected, evidence: [`Jupiter is ${dist}th from Moon`] };
    },
  },
  {
    id: 'yoga.budhaditya',
    name: 'Budha-Aditya Yoga',
    family: 'Yoga', source: 'Classical', tradition: 'Parashari', applicableChart: 'D1',
    conditions: 'Sun and Mercury conjoin in the same house.',
    cancellation: 'Deep combustion of Mercury can reduce intellect significations.',
    detect: (k) => {
      const detected = houseOf(k, 'Sun') === houseOf(k, 'Mercury');
      return { detected, evidence: [`Sun house=${houseOf(k, 'Sun')}, Mercury house=${houseOf(k, 'Mercury')}`] };
    },
  },

  // ── Dhana Yogas (batch) ───────────────────────────────────────────────────
  {
    id: 'dhana.2_11_connection',
    name: 'Dhana Yoga (2nd–11th lords)',
    family: 'Yoga', source: 'BPHS', tradition: 'Parashari', applicableChart: 'D1',
    conditions: 'Lords of the 2nd and 11th houses conjoin or exchange.',
    cancellation: 'Afflicted 2nd/11th lords reduce wealth yoga.',
    detect: (k) => {
      const l2 = lordOfHouse(k, 2); const l11 = lordOfHouse(k, 11);
      const detected = l2 !== l11 && houseOf(k, l2) === houseOf(k, l11);
      return { detected, evidence: [`2nd lord=${l2} (house ${houseOf(k, l2)}), 11th lord=${l11} (house ${houseOf(k, l11)})`] };
    },
  },

  // ── Doshas (batch) ────────────────────────────────────────────────────────
  {
    id: 'dosha.mangal',
    name: 'Mangal Dosha (Kuja Dosha)',
    family: 'Dosha', source: 'Classical', tradition: 'Parashari', applicableChart: 'D1',
    conditions: 'Mars in house 1, 2, 4, 7, 8, or 12 from Lagna.',
    cancellation: 'Cancelled if Mars in own/exalted sign, or aspected by Jupiter, or various classical mitigations; also examine from Moon & Venus.',
    detect: (k) => {
      const h = houseOf(k, 'Mars');
      const detected = [1, 2, 4, 7, 8, 12].includes(h);
      const dig = dignityOf(k, 'Mars');
      const cancelled = /Exalted|Own|Moolatrikona/.test(dig);
      return { detected: detected && !cancelled, evidence: [`Mars house=${h}`, `Mars dignity=${dig}`, cancelled ? 'Cancellation: Mars in own/exalted sign' : 'No dignity-based cancellation'] };
    },
  },
  {
    id: 'dosha.kaalsarpa',
    name: 'Kaal Sarpa Dosha',
    family: 'Dosha', source: 'Modern classical', tradition: 'Parashari', applicableChart: 'D1',
    conditions: 'All seven grahas hemmed between Rahu and Ketu (one side of the axis).',
    cancellation: 'Partial if any graha falls outside the Rahu–Ketu arc.',
    detect: (k) => {
      const rahu = signOf(planet(k, 'Rahu').longitude);
      const ketu = signOf(planet(k, 'Ketu').longitude);
      const rahuLon = planet(k, 'Rahu').longitude;
      const others = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
      // arc from Rahu forward to Ketu
      const within = (lon) => { const rel = ((lon - rahuLon) % 360 + 360) % 360; return rel <= 180; };
      const sides = others.map((n) => within(planet(k, n).longitude));
      const allOneSide = sides.every((s) => s) || sides.every((s) => !s);
      return { detected: allOneSide, evidence: [`Rahu sign=${rahu + 1}, Ketu sign=${ketu + 1}`, `Grahas on Rahu side: ${sides.filter(Boolean).length}/7`] };
    },
  },
  {
    id: 'dosha.kemadruma',
    name: 'Kemadruma Dosha',
    family: 'Dosha', source: 'BPHS', tradition: 'Parashari', applicableChart: 'D1',
    conditions: 'No planet (except Sun/nodes) in the 2nd or 12th from the Moon, and none in kendras from Moon.',
    cancellation: 'Cancelled if a planet is in a kendra from Moon/Lagna or Moon is aspected by a benefic.',
    detect: (k) => {
      const moonSign = signOf(k.moon.longitude);
      const around = [addSigns(moonSign, -1), addSigns(moonSign, 1)];
      const occupants = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].filter((n) => around.includes(signOf(planet(k, n).longitude)));
      const detected = occupants.length === 0;
      return { detected, evidence: [`Planets in 2nd/12th from Moon: ${occupants.join(', ') || 'none'}`] };
    },
  },
  {
    id: 'dosha.grahan',
    name: 'Grahan Dosha',
    family: 'Dosha', source: 'Classical', tradition: 'Parashari', applicableChart: 'D1',
    conditions: 'Sun or Moon conjunct Rahu/Ketu in the same sign.',
    cancellation: 'Benefic aspects reduce the affliction.',
    detect: (k) => {
      const nodes = [signOf(planet(k, 'Rahu').longitude), signOf(planet(k, 'Ketu').longitude)];
      const sun = signOf(planet(k, 'Sun').longitude);
      const moon = signOf(k.moon.longitude);
      const sunAff = nodes.includes(sun);
      const moonAff = nodes.includes(moon);
      return { detected: sunAff || moonAff, evidence: [sunAff ? 'Sun with a node' : '', moonAff ? 'Moon with a node' : ''].filter(Boolean).join('; ') ? [(sunAff ? 'Sun with a node' : ''), (moonAff ? 'Moon with a node' : '')].filter(Boolean) : ['No Sun/Moon–node conjunction'] };
    },
  },
];

/** Evaluate all rules against a kundali → detection report. */
export function evaluateYogas(kundali) {
  const results = RULES.map((r) => {
    const { detected, evidence } = r.detect(kundali);
    return {
      id: r.id, name: r.name, family: r.family, source: r.source, tradition: r.tradition,
      applicableChart: r.applicableChart, conditions: r.conditions, cancellation: r.cancellation,
      detected, evidence,
    };
  });
  return {
    convention: 'IMPLEMENTED_CONVENTION_CLASSICAL',
    total: results.length,
    detected: results.filter((r) => r.detected),
    notDetected: results.filter((r) => !r.detected),
    all: results,
  };
}

export function listRules() {
  return RULES.map((r) => ({ id: r.id, name: r.name, family: r.family, source: r.source, tradition: r.tradition, applicableChart: r.applicableChart, conditions: r.conditions, cancellation: r.cancellation }));
}

export default { RULES, evaluateYogas, listRules };
