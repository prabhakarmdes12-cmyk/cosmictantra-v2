/**
 * KUNDLI V43 — executive insight parity layer.
 *
 * ── The problem this solves ────────────────────────────────────────────────
 * The `/report` screen and the downloadable PDF stopped describing the same
 * chart. On screen, the visitor reads a six-dimension Executive Life Gauge and
 * nine four-quadrant Graha Archetype cards (`ExecutiveLifeGaugeDashboard`). The
 * qualified PDF — the document a Pandit actually holds during a consultation,
 * and the one the ₹501 handover delivers on WhatsApp — carried neither. Two
 * artifacts, one chart, two different stories.
 *
 * This module closes that gap WITHOUT computing anything new:
 *
 *   • it reads the SAME `CanonicalJyotishSnapshot` that pipeline v2's GATE 2
 *     already built the canonical model from — no second ephemeris call, so the
 *     PDF and the screen cannot disagree about a degree;
 *   • it calls the SAME two functions the website calls
 *     (`computeExecutiveLifeDimensions`, `computeGrahaArchetypeCards`), so a
 *     score printed on paper is the score the visitor saw on screen, and one
 *     implementation of the rule set cannot drift from the other.
 *
 * ── Epistemic status ───────────────────────────────────────────────────────
 * The six scores are derived from graha bala ratios and Sarvashtakavarga
 * bindus. The bala engine is recorded in the derived model's capability
 * inventory as VALIDATION_PENDING: computed, not yet checked against an
 * external reference. That status travels with the numbers — the report section
 * this feeds prints it as a limitation callout, and the archetype quadrants are
 * tagged as traditional karakatva guidance rather than individualised
 * prediction. Parity with the screen is not a licence to upgrade a presentation
 * layer into a verdict.
 *
 * ── Failure behaviour ──────────────────────────────────────────────────────
 * Returning `null` is allowed and expected to be survivable: the report model
 * then omits the section rather than failing the whole download. A missing
 * presentation layer is a smaller harm than no Kundli at all.
 */

import type { CanonicalJyotishSnapshot } from '../../jyotish/canonicalSnapshot';
import {
  computeExecutiveLifeDimensions,
  computeGrahaArchetypeCards,
  type ExecutiveLifeDimension,
  type GrahaArchetypeCard,
} from '../../jyotish/executiveLifeGauge';

export const EXECUTIVE_INSIGHTS_VERSION = 'kundli-executive-insights-v1';

/**
 * The classical aim each dimension's OWN significators carry.
 *
 * This is a reading of the bhava/graha significators the gauge already reports
 * (4th + Chandra, 10th + Surya/Mangala, 2nd–11th + Guru/Budha, 7th + Shukra,
 * 1st–3rd + Mangala, 9th–12th + Guru) against the traditional purushartha
 * vocabulary. It adds no score and no new fact; it lets a Pandit place a modern
 * dimension inside the classical frame in one glance.
 */
export const CLASSICAL_AXES: Record<string, { hi: string; en: string }> = {
  emotional_resilience: { hi: 'सुख · मानसिक आरोग्य', en: 'Sukha · Manas (4th, Chandra)' },
  career_trajectory: { hi: 'कर्म · कीर्ति', en: 'Karma · Kirti (10th, Surya–Mangala)' },
  financial_stability: { hi: 'अर्थ · संचय', en: 'Artha (2nd–11th, Guru–Budha)' },
  relationship_sensitivity: { hi: 'काम · साझेदारी', en: 'Kama · Bandhutva (7th, Shukra)' },
  leadership_force: { hi: 'पराक्रम · शौर्य', en: 'Parakrama (1st–3rd, Mangala)' },
  spiritual_inclination: { hi: 'धर्म · मोक्ष', en: 'Dharma · Moksha (9th–12th, Guru)' },
};

/**
 * Which grahas and bhavas each dimension is actually computed from.
 *
 * Mirrors `computeExecutiveLifeDimensions` line for line (Chandra + 4th,
 * Surya/Mangala + 10th, Guru/Budha + 2nd–11th, Shukra + 7th, Mangala +
 * 1st–3rd, Guru + 9th–12th). The report model renders these through its OWN
 * label registry rather than reprinting the dashboard's free-text significator
 * string, so a Hindi folio says चन्द्र and not "Moon (चन्द्र)" — the §3 Hindi
 * budget measures exactly that difference.
 */
export const DIMENSION_SIGNIFICATORS: Record<string, { grahas: string[]; bhavas: number[] }> = {
  emotional_resilience: { grahas: ['Moon'], bhavas: [4] },
  career_trajectory: { grahas: ['Sun', 'Mars'], bhavas: [10] },
  financial_stability: { grahas: ['Jupiter', 'Mercury'], bhavas: [2, 11] },
  relationship_sensitivity: { grahas: ['Venus'], bhavas: [7] },
  leadership_force: { grahas: ['Mars'], bhavas: [1, 3] },
  spiritual_inclination: { grahas: ['Jupiter'], bhavas: [9, 12] },
};

/** Significators for a dimension id, or null when the id is not recognised. */
export function significatorsFor(dimensionId: string): { grahas: string[]; bhavas: number[] } | null {
  return DIMENSION_SIGNIFICATORS[dimensionId] ?? null;
}

/**
 * The actionable line printed under each dimension.
 *
 * Authored here rather than taken from the dashboard's `insightEn`, for two
 * reasons. First, that sentence restates the numbers (which the evidence line
 * already carries) and names the strength ratio in English — the ASCII token is
 * on the Part A forbidden list (PA-06), and the honest Hindi word षड्बल is what
 * a Pandit says aloud. Second, a folio should leave the reader with something to
 * DO, so these are practice lines keyed to the dimension's own bhavas.
 *
 * They are PRACTICAL_REFLECTION: human guidance. No event, no timing, no
 * verdict, and no promise of a result.
 */
export const DIMENSION_TAKEAWAYS: Record<string, { hi: string; en: string }> = {
  emotional_resilience: {
    en: 'Inner reserve is a practice, not a temperament. Fixed sleep, one silent hour a day and a settled diet are the classical supports of the fourth bhava; keep them precisely when the workload rises.',
    hi: 'आन्तरिक धैर्य स्वभाव नहीं, साधना है। निश्चित निद्रा, दिन का एक मौन घण्टा और संयमित आहार — ये चतुर्थ भाव के शास्त्रीय आधार हैं; कार्यभार बढ़ने पर इन्हें ही बनाए रखें।',
  },
  career_trajectory: {
    en: 'Standing at work accumulates in public. Take the visible responsibility, answer for the result yourself, and keep one written record of decisions: the tenth bhava rewards continuity more than intensity.',
    hi: 'कर्म-क्षेत्र की प्रतिष्ठा सार्वजनिक रूप से ही संचित होती है। दृश्यमान उत्तरदायित्व स्वीकारें, परिणाम का भार स्वयं लें और निर्णयों का एक लिखित अभिलेख रखें — दशम भाव तीव्रता से अधिक निरन्तरता को पुरस्कृत करता है।',
  },
  financial_stability: {
    en: 'Accrual is a discipline of the second and eleventh bhavas: set aside a fixed share before spending, keep a written ledger, and commit no capital on one day\u2019s enthusiasm.',
    hi: 'धन-संचय द्वितीय एवं एकादश भाव का अनुशासन है — व्यय से पूर्व एक निश्चित अंश अलग रखें, लिखित बही रखें और किसी एक दिन के उत्साह में सम्पूर्ण पूँजी न लगाएँ।',
  },
  relationship_sensitivity: {
    en: 'Partnership is read through the seventh bhava: say the difficult thing early and plainly, keep a standing weekly hour for the relationship, and never let courtesy replace honesty.',
    hi: 'साझेदारी का पाठ सप्तम भाव से होता है — कठिन बात शीघ्र और स्पष्ट कहें, सम्बन्ध हेतु सप्ताह में एक निश्चित समय रखें और शिष्टाचार को सत्यता का विकल्प न बनने दें।',
  },
  leadership_force: {
    en: 'Initiative belongs to the first and third bhavas: regular physical training, one short daily discipline of the body, and one decision a day that could have been postponed. Force without routine reads as friction.',
    hi: 'पहल प्रथम एवं तृतीय भाव का विषय है — नियमित व्यायाम, शरीर की एक अल्प दैनिक साधना और प्रतिदिन एक ऐसा निर्णय जो टाला जा सकता था। अनुशासन के बिना ओज टकराव बन जाता है।',
  },
  spiritual_inclination: {
    en: 'The ninth and twelfth bhavas are read together: study one text steadily instead of many at once, keep a weekly hour of service without expectation, and choose a practice ordinary enough to survive a busy month.',
    hi: 'नवम एवं द्वादश भाव एक साथ पढ़े जाते हैं — अनेक के स्थान पर एक ग्रन्थ का नियमित अध्ययन, सप्ताह में एक निष्काम सेवा का समय, और ऐसी साधारण साधना जो व्यस्त माह में भी टिकी रहे।',
  },
};

/** Actionable line for a dimension id, or null when the id is not recognised. */
export function takeawayFor(dimensionId: string): { hi: string; en: string } | null {
  return DIMENSION_TAKEAWAYS[dimensionId] ?? null;
}

export interface ExecutiveInsights {
  version: typeof EXECUTIVE_INSIGHTS_VERSION;
  /** The six on-screen dimensions, in the order the dashboard shows them. */
  dimensions: ExecutiveLifeDimension[];
  /** The nine four-quadrant graha cards, in the dashboard's order. */
  archetypes: GrahaArchetypeCard[];
  /** Provenance for the appendix: which engines produced these numbers. */
  provenance: {
    source: string;
    snapshotEngineVersion: string;
    dimensionCount: number;
    archetypeCount: number;
  };
}

/** Classical axis for a dimension id, or null when the id is not recognised. */
export function classicalAxisFor(dimensionId: string): { hi: string; en: string } | null {
  return CLASSICAL_AXES[dimensionId] ?? null;
}

/**
 * Builds the insight bundle from an already-computed snapshot.
 *
 * Never throws: a failure here must cost the reader one section, not their
 * Kundli. The reason is returned on the console (server-side) rather than in
 * the document, because "our presentation layer errored" is not something a
 * client-facing folio should print.
 */
export function buildExecutiveInsights(
  snapshot: CanonicalJyotishSnapshot | null | undefined,
): ExecutiveInsights | null {
  if (!snapshot) return null;
  try {
    const dimensions = computeExecutiveLifeDimensions(snapshot);
    const archetypes = computeGrahaArchetypeCards(snapshot);
    if (!Array.isArray(dimensions) || dimensions.length === 0) return null;
    if (!Array.isArray(archetypes) || archetypes.length === 0) return null;

    return {
      version: EXECUTIVE_INSIGHTS_VERSION,
      dimensions,
      archetypes,
      provenance: {
        source: 'src/lib/jyotish/executiveLifeGauge.ts (same module the /report dashboard calls)',
        snapshotEngineVersion: String(snapshot?.meta?.engineVersion ?? 'unknown'),
        dimensionCount: dimensions.length,
        archetypeCount: archetypes.length,
      },
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[kundli/executiveInsights] presentation layer unavailable', err);
    return null;
  }
}
