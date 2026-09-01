/**
 * KUNDLI V40 — Career synthesis (§20, §21).
 *
 * The reference implementation of `JyotishSynthesis`. One domain, done
 * properly, rather than ten domains done shallowly.
 *
 * Factor ladder (declared, in order). A factor that cannot be resolved does
 * NOT block the synthesis; it lowers evidence coverage and is listed by name:
 *
 *   10th bhava -> 10th lord -> occupants of the 10th -> lagnesha relationship
 *   -> artha trikona (2/6/10/11) -> functional lordship -> dignity
 *   -> full drishti on the 10th -> yogas -> D10 -> MD/AD/PD activation
 *
 * Contradictions are first-class: supporting, challenging and mixed factors
 * are all modelled, and the conclusion may say "natal indication strong,
 * current activation moderate". Coverage is a measure of how much of the
 * declared checklist produced evidence. It is NOT a probability, and the
 * conclusion says so.
 */

import type { KundliCanonicalModel } from '../types';
import type {
  EvidenceClaim, StructuredConclusion, ConfidenceReport, JyotishSystem,
} from './contentTypes';
import { FACT } from './factPaths';
import type { GrahaConditionResult, GrahaCondition } from './grahaCondition';
import type { BhavaIntelligenceResult } from './bhavaIntelligence';
import type { DashaActivation } from './dashaActivation';
import { D10_PROMOTION } from './d10Validation';
import { dm } from './format';
import { KENDRA_HOUSES, TRIKONA_HOUSES, DUSTHANA_HOUSES } from './functionalLordship';

export const CAREER_SYNTHESIS_VERSION = 'career-synthesis-v1';

export interface JyotishSynthesis {
  domain: 'CAREER';
  engineVersion: string;
  system: JyotishSystem;
  natalPromise: EvidenceClaim[];
  supportiveFactors: EvidenceClaim[];
  challengingFactors: EvidenceClaim[];
  mixedFactors: EvidenceClaim[];
  vargaConfirmation: EvidenceClaim[];
  dashaActivation: EvidenceClaim[];
  transitActivation: EvidenceClaim[];
  conclusion: StructuredConclusion;
  confidence: ConfidenceReport;
}

/** The declared checklist. Coverage is measured against exactly this list. */
export const CAREER_FACTORS = [
  'TENTH_BHAVA_SIGN',
  'TENTH_LORD_IDENTITY',
  'TENTH_LORD_PLACEMENT',
  'TENTH_OCCUPANTS',
  'LAGNESHA_RELATION',
  'ARTHA_TRIKONA',
  'FUNCTIONAL_LORDSHIP',
  'DIGNITY_OF_KEY_GRAHAS',
  'DRISHTI_ON_TENTH',
  'CAREER_YOGAS',
  'D10_CONFIRMATION',
  'DASHA_ACTIVATION',
  'TRANSIT_ACTIVATION',
] as const;

const ORDINAL = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

/** Turns a dignity enum into readable English. */
function dignityPhrase(category: string): string {
  switch (category) {
    case 'OWN_SIGN': return 'in its own sign';
    case 'MOOLATRIKONA': return 'in its moolatrikona';
    case 'EXALTED': return 'exalted';
    case 'DEBILITATED': return 'debilitated';
    case 'FRIEND_SIGN': return 'in a friendly sign';
    case 'ENEMY_SIGN': return 'in an inimical sign';
    case 'NEUTRAL': return 'in a neutral sign';
    default: return category.replace(/_/g, ' ').toLowerCase();
  }
}

/** MAHADASHA -> "mahadasha", ANTARDASHA -> "antardasha". */
function levelWord(level: string): string {
  return level.toLowerCase().replace('dasha', 'dasha');
}
const ARTHA_HOUSES = [2, 6, 10, 11];

const claim = (
  id: string,
  statement: string,
  polarity: EvidenceClaim['polarity'],
  evidenceIds: string[],
  contentType: EvidenceClaim['contentType'] = 'DERIVED_JYOTISH_FACT',
): EvidenceClaim => ({
  id, contentType, system: 'PARASHARI', statement, polarity, evidenceIds,
});

const notCalculated = (id: string, statement: string, reason: string): EvidenceClaim => ({
  id, contentType: 'NOT_CALCULATED', system: 'PARASHARI', statement,
  polarity: 'NEUTRAL', evidenceIds: [], notCalculatedReason: reason,
});

export function buildCareerSynthesis(
  canonical: KundliCanonicalModel,
  conditions: GrahaConditionResult,
  bhavas: BhavaIntelligenceResult,
  activation: DashaActivation,
): JyotishSynthesis {
  const resolved = new Set<string>();
  const missing: { factor: string; reason: string }[] = [];

  const natalPromise: EvidenceClaim[] = [];
  const supportive: EvidenceClaim[] = [];
  const challenging: EvidenceClaim[] = [];
  const mixed: EvidenceClaim[] = [];
  const vargaConfirmation: EvidenceClaim[] = [];
  const dashaClaims: EvidenceClaim[] = [];
  const transitClaims: EvidenceClaim[] = [];

  const tenth = bhavas.bhavas.find((b) => b.house === 10);
  const conditionOf = (g: string): GrahaCondition | undefined => conditions.conditions.find((c) => c.graha === g);

  /* 1 — 10th bhava sign -------------------------------------------- */
  if (tenth) {
    resolved.add('TENTH_BHAVA_SIGN');
    natalPromise.push(claim(
      'CAREER_TENTH_SIGN',
      `The 10th bhava (karma bhava) carries ${tenth.signName} (${tenth.signEn}).`,
      'NEUTRAL',
      [FACT.houseSignId(10)],
      'CALCULATED_FACT',
    ));
  } else {
    missing.push({ factor: 'TENTH_BHAVA_SIGN', reason: 'The canonical model carries no 10th bhava.' });
  }

  /* 2 & 3 — 10th lord and its placement ----------------------------- */
  const tenthLord = tenth?.lord ?? null;
  const tenthLordCondition = tenthLord ? conditionOf(tenthLord) : undefined;
  if (tenthLord) {
    resolved.add('TENTH_LORD_IDENTITY');
    natalPromise.push(claim(
      'CAREER_TENTH_LORD',
      `${tenthLord} rules the 10th bhava for this lagna.`,
      'NEUTRAL',
      [FACT.houseSignLord(10)],
    ));
  } else {
    missing.push({ factor: 'TENTH_LORD_IDENTITY', reason: 'The sign on the 10th could not be resolved to a lord.' });
  }

  if (tenthLordCondition) {
    resolved.add('TENTH_LORD_PLACEMENT');
    const h = tenthLordCondition.house;
    const inKendraTrikona = KENDRA_HOUSES.includes(h) || TRIKONA_HOUSES.includes(h);
    const inDusthana = DUSTHANA_HOUSES.includes(h);
    const target = inDusthana ? challenging : inKendraTrikona ? supportive : mixed;
    target.push(claim(
      'CAREER_TENTH_LORD_PLACEMENT',
      `The 10th lord ${tenthLordCondition.graha} occupies the ${ORDINAL[h]} bhava in ${tenthLordCondition.signName}` +
      `${inDusthana ? ' — a dusthana, which the tradition reads as obstruction to the bhava it rules' : inKendraTrikona ? ' — a kendra/trikona, which the tradition reads as support for the bhava it rules' : ''}.`,
      inDusthana ? 'CHALLENGING' : inKendraTrikona ? 'SUPPORTING' : 'MIXED',
      [FACT.planetHouse(tenthLordCondition.graha), FACT.planetSignId(tenthLordCondition.graha)],
    ));
  } else if (tenthLord) {
    missing.push({ factor: 'TENTH_LORD_PLACEMENT', reason: `${tenthLord} has no resolved placement in the canonical model.` });
  } else {
    missing.push({ factor: 'TENTH_LORD_PLACEMENT', reason: 'No 10th lord to place.' });
  }

  /* 4 — occupants of the 10th --------------------------------------- */
  if (tenth) {
    resolved.add('TENTH_OCCUPANTS');
    if (tenth.occupants.length === 0) {
      mixed.push(claim(
        'CAREER_TENTH_EMPTY',
        'No graha occupies the 10th bhava. The tradition then reads the karma bhava chiefly through its lord and the drishti it receives; an empty bhava is not a weak bhava.',
        'MIXED',
        [FACT.houseOccupants(10)],
      ));
    } else {
      for (const occ of tenth.occupants) {
        const c = conditionOf(occ);
        if (!c) continue;
        const strong = ['EXALTED', 'OWN_SIGN', 'MOOLATRIKONA'].includes(c.dignity.category);
        const weak = ['DEBILITATED', 'ENEMY'].includes(c.dignity.category);
        const target = strong ? supportive : weak ? challenging : mixed;
        target.push(claim(
          `CAREER_TENTH_OCCUPANT_${occ}`,
          `${occ} occupies the 10th bhava in ${c.signName} (${c.dignity.category.replace(/_/g, ' ').toLowerCase()}).`,
          strong ? 'SUPPORTING' : weak ? 'CHALLENGING' : 'MIXED',
          [FACT.planetHouse(occ), FACT.planetDignity(occ)],
        ));
      }
    }
  } else {
    missing.push({ factor: 'TENTH_OCCUPANTS', reason: 'No 10th bhava resolved.' });
  }

  /* 5 — lagnesha relationship --------------------------------------- */
  const lagnesha = bhavas.bhavas.find((b) => b.house === 1)?.lord ?? null;
  const lagneshaCondition = lagnesha ? conditionOf(lagnesha) : undefined;
  if (lagneshaCondition && tenthLordCondition) {
    resolved.add('LAGNESHA_RELATION');
    const sameHouse = lagneshaCondition.house === tenthLordCondition.house;
    const lagneshaInTenth = lagneshaCondition.house === 10;
    const tenthLordInFirst = tenthLordCondition.house === 1;
    const mutual = lagneshaInTenth && tenthLordInFirst;
    if (mutual) {
      supportive.push(claim(
        'CAREER_LAGNESHA_EXCHANGE',
        `Lagnesha ${lagnesha} sits in the 10th while the 10th lord ${tenthLord} sits in the lagna — a mutual exchange between the 1st and 10th.`,
        'SUPPORTING',
        [FACT.planetHouse(lagnesha!), FACT.planetHouse(tenthLord!)],
      ));
    } else if (sameHouse) {
      supportive.push(claim(
        'CAREER_LAGNESHA_CONJUNCT_TENTH_LORD',
        `Lagnesha ${lagnesha} and the 10th lord ${tenthLord} occupy the same bhava (${ORDINAL[lagneshaCondition.house]}), linking the self and the karma bhava.`,
        'SUPPORTING',
        [FACT.planetHouse(lagnesha!), FACT.planetHouse(tenthLord!)],
      ));
    } else if (lagneshaInTenth) {
      supportive.push(claim(
        'CAREER_LAGNESHA_IN_TENTH',
        `Lagnesha ${lagnesha} occupies the 10th bhava, placing the self directly in the karma bhava.`,
        'SUPPORTING',
        [FACT.planetHouse(lagnesha!)],
      ));
    } else {
      mixed.push(claim(
        'CAREER_LAGNESHA_RELATION',
        `Lagnesha ${lagnesha} (${ORDINAL[lagneshaCondition.house]} bhava) and the 10th lord ${tenthLord} (${ORDINAL[tenthLordCondition.house]} bhava) are not directly linked by conjunction or exchange.`,
        'MIXED',
        [FACT.planetHouse(lagnesha!), FACT.planetHouse(tenthLord!)],
      ));
    }
  } else {
    missing.push({ factor: 'LAGNESHA_RELATION', reason: 'Lagnesha or 10th lord placement unresolved.' });
  }

  /* 6 — artha trikona ------------------------------------------------ */
  const arthaBhavas = bhavas.bhavas.filter((b) => ARTHA_HOUSES.includes(b.house));
  if (arthaBhavas.length === ARTHA_HOUSES.length) {
    resolved.add('ARTHA_TRIKONA');
    const arthaLords = arthaBhavas.map((b) => b.lord).filter(Boolean) as string[];
    const linked = arthaBhavas.filter((b) => b.occupants.length > 0);
    mixed.push(claim(
      'CAREER_ARTHA_TRIKONA',
      `Artha bhavas 2 / 6 / 10 / 11 are ruled by ${[...new Set(arthaLords)].join(', ')}; ` +
      (linked.length > 0
        ? `occupied bhavas: ${linked.map((b) => `${b.house} (${b.occupants.join(', ')})`).join('; ')}.`
        : 'none of them is occupied.'),
      'MIXED',
      ARTHA_HOUSES.flatMap((h) => [FACT.houseSignId(h), FACT.houseOccupants(h)]),
    ));
  } else {
    missing.push({ factor: 'ARTHA_TRIKONA', reason: 'One or more of bhavas 2/6/10/11 is unresolved.' });
  }

  /* 7 — functional lordship of the key grahas ------------------------ */
  const keyGrahas = [...new Set([tenthLord, lagnesha, ...(tenth?.occupants ?? [])].filter(Boolean) as string[])];
  if (keyGrahas.length > 0) {
    resolved.add('FUNCTIONAL_LORDSHIP');
    for (const g of keyGrahas) {
      const c = conditionOf(g);
      if (!c) continue;
      const fl = c.functionalLordship;
      const polarity: EvidenceClaim['polarity'] = fl.yogakaraka ? 'SUPPORTING'
        : (fl.rulesDusthana && !fl.rulesTrikona) ? 'CHALLENGING' : 'MIXED';
      const bucket = polarity === 'SUPPORTING' ? supportive : polarity === 'CHALLENGING' ? challenging : mixed;
      bucket.push(claim(
        `CAREER_FUNCTIONAL_${g}`,
        `${g} — ${fl.functionalStatement} Natural character: ${fl.naturalCharacter.toLowerCase()}.`,
        polarity,
        fl.evidenceIds,
      ));
    }
  } else {
    missing.push({ factor: 'FUNCTIONAL_LORDSHIP', reason: 'No key graha could be identified for the career domain.' });
  }

  /* 8 — dignity of key grahas ---------------------------------------- */
  if (keyGrahas.length > 0) {
    resolved.add('DIGNITY_OF_KEY_GRAHAS');
    for (const g of keyGrahas) {
      const c = conditionOf(g);
      if (!c) continue;
      const cat = c.dignity.category;
      if (cat === 'EXALTED' || cat === 'OWN_SIGN' || cat === 'MOOLATRIKONA') {
        supportive.push(claim(
          `CAREER_DIGNITY_${g}`,
          `${g} is ${dignityPhrase(cat)} (${c.signName}).`,
          'SUPPORTING',
          c.dignity.evidenceIds,
        ));
      } else if (cat === 'DEBILITATED' || cat === 'ENEMY') {
        challenging.push(claim(
          `CAREER_DIGNITY_${g}`,
          `${g} is ${dignityPhrase(cat)} (${c.signName}).`,
          'CHALLENGING',
          c.dignity.evidenceIds,
        ));
      }
      if (c.combustion.status === 'COMBUST') {
        challenging.push(claim(
          `CAREER_COMBUST_${g}`,
          `${g} is combust — ${dm(c.combustion.angularDistance ?? 0)} from the Sun against an orb of ${dm(c.combustion.orbUsed ?? 0)}.`,
          'CHALLENGING',
          c.combustion.evidenceIds,
        ));
      } else if (c.combustion.nearCombust) {
        mixed.push(claim(
          `CAREER_NEAR_COMBUST_${g}`,
          `${g} is close to the Sun (${dm(c.combustion.angularDistance ?? 0)} against an orb of ${dm(c.combustion.orbUsed ?? 0)}) but outside the adopted combustion orb.`,
          'MIXED',
          c.combustion.evidenceIds,
        ));
      }
      if (c.motion.retrograde && !['Rahu', 'Ketu'].includes(g)) {
        mixed.push(claim(
          `CAREER_RETROGRADE_${g}`,
          `${g} is retrograde at birth. The tradition disagrees about whether retrogression strengthens or unsettles a graha, so this is recorded as a mixed factor rather than resolved.`,
          'MIXED',
          [FACT.planetRetrograde(g)],
        ));
      }
    }
  } else {
    missing.push({ factor: 'DIGNITY_OF_KEY_GRAHAS', reason: 'No key graha identified.' });
  }

  /* 9 — drishti on the 10th ------------------------------------------ */
  if (tenth) {
    resolved.add('DRISHTI_ON_TENTH');
    if (tenth.aspectsReceived.length === 0) {
      mixed.push(claim(
        'CAREER_TENTH_NO_DRISHTI',
        'The 10th bhava receives no full Parashari drishti under the adopted aspect policy.',
        'MIXED',
        [FACT.houseSignId(10)],
      ));
    } else {
      for (const a of tenth.aspectsReceived) {
        const c = conditionOf(a.from);
        const benefic = c?.functionalLordship.naturalCharacter === 'BENEFIC';
        const target = benefic ? supportive : mixed;
        target.push(claim(
          `CAREER_DRISHTI_${a.from}`,
          // The sentence already states the rule in words ("its 7th full
          // drishti"), so the machine rule id was pure duplication in Part A.
          // It survives verbatim in the Scholar Appendix aspect ledger, which
          // prints ruleId per aspect, and in the evidence ids carried below.
          `${a.from} casts its ${ORDINAL[a.offset] ?? `${a.offset}th`} full drishti on the 10th bhava.`,
          benefic ? 'SUPPORTING' : 'MIXED',
          a.evidenceIds,
        ));
      }
    }
  } else {
    missing.push({ factor: 'DRISHTI_ON_TENTH', reason: 'No 10th bhava resolved.' });
  }

  /* 10 — yogas ------------------------------------------------------- */
  const relevantYogas = canonical.yogas.filter((y) =>
    y.inputs.planets.some((p) => keyGrahas.includes(p)) || y.inputs.houses.some((h) => ARTHA_HOUSES.includes(h)),
  );
  if (relevantYogas.length > 0) {
    resolved.add('CAREER_YOGAS');
    // Rules that did not fire are reported once, together. Giving every
    // absent yoga its own factor pads the page and buries the handful of
    // factors that actually carry the reading.
    const absentYogas = relevantYogas.filter((y) => y.status === 'ABSENT');
    const unresolvedYogas = relevantYogas.filter((y) => y.status !== 'ABSENT' && y.status !== 'PRESENT');
    for (const y of relevantYogas) {
      if (y.status === 'PRESENT') {
        supportive.push({
          id: `CAREER_YOGA_${y.id}`,
          contentType: 'TRADITIONAL_RULE',
          system: y.system,
          statement: `${y.name} is present — every condition of the applied rule evaluated true.`,
          polarity: 'SUPPORTING',
          evidenceIds: [FACT.yogaStatus(y.id)],
        });
      }
    }
    if (absentYogas.length > 0) {
      mixed.push({
        id: 'CAREER_YOGAS_ABSENT',
        contentType: 'TRADITIONAL_RULE',
        system: 'PARASHARI',
        statement:
          `${absentYogas.length} career-relevant yoga rule(s) were evaluated and did not apply to this chart, so they ` +
          `contribute nothing either way: ${absentYogas.map((y) => y.name).join(', ')}.`,
        polarity: 'NEUTRAL',
        evidenceIds: absentYogas.map((y) => FACT.yogaStatus(y.id)),
      });
    }
    if (unresolvedYogas.length > 0) {
      mixed.push({
        id: 'CAREER_YOGAS_UNRESOLVED',
        contentType: 'NOT_CALCULATED',
        system: 'PARASHARI',
        statement:
          `${unresolvedYogas.length} career-relevant yoga rule(s) could not be resolved by this engine and are therefore ` +
          `not used as evidence in either direction: ${unresolvedYogas.map((y) => y.name).join(', ')}.`,
        polarity: 'NEUTRAL',
        evidenceIds: unresolvedYogas.map((y) => FACT.yogaStatus(y.id)),
        notCalculatedReason: 'Reported as not calculated; absence is not claimed.',
      });
    }
  } else {
    missing.push({ factor: 'CAREER_YOGAS', reason: 'No registered yoga rule involves the career grahas or the artha bhavas in this chart.' });
  }

  /* 11 — D10 --------------------------------------------------------- */
  if (D10_PROMOTION.mayInfluenceConclusions) {
    resolved.add('D10_CONFIRMATION');
  } else {
    vargaConfirmation.push(notCalculated(
      'CAREER_D10',
      'D10 (Dashamsha) is not used to confirm or contradict this reading.',
      D10_PROMOTION.reason,
    ));
    missing.push({ factor: 'D10_CONFIRMATION', reason: D10_PROMOTION.reason });
  }
  // D9 is verified and is reported as a cross-chart observation, not as a
  // career verdict: the navamsha is a dharma/strength chart, not the karma varga.
  if (tenthLordCondition?.vargottama.status === 'CALCULATED') {
    vargaConfirmation.push(claim(
      'CAREER_D9_TENTH_LORD',
      `In D9 the 10th lord ${tenthLordCondition.graha} stands in ${tenthLordCondition.vargottama.d9Sign}` +
      `${tenthLordCondition.vargottama.value ? ' — vargottama (same sign as D1)' : ''}. D9 is reported as cross-chart context; it is not a career varga.`,
      tenthLordCondition.vargottama.value ? 'SUPPORTING' : 'NEUTRAL',
      tenthLordCondition.vargottama.evidenceIds,
    ));
  }

  /* 12 — dasha activation --------------------------------------------- */
  const careerHouses = new Set(ARTHA_HOUSES);
  let anyActivation = false;
  for (const p of activation.profiles) {
    if (p.status !== 'CALCULATED') {
      dashaClaims.push(notCalculated(
        `CAREER_ACTIVATION_${p.level}`,
        `${p.level.toLowerCase()} lord could not be profiled.`,
        p.notCalculatedReason ?? 'Unresolved.',
      ));
      continue;
    }
    const touchedHouses = new Set<number>([
      ...(p.natalHouse ? [p.natalHouse] : []),
      ...(p.rulesHouses ?? []),
      ...(p.aspectsGivenTo ?? []),
    ]);
    const careerTouch = [...touchedHouses].filter((h) => careerHouses.has(h)).sort((a, b) => a - b);
    const isKeyGraha = keyGrahas.includes(p.lord);
    if (careerTouch.length > 0 || isKeyGraha) anyActivation = true;
    dashaClaims.push(claim(
      `CAREER_ACTIVATION_${p.level}`,
      careerTouch.length > 0
        ? `The ${levelWord(p.level)} lord ${p.lord} touches artha bhava(s) ${careerTouch.join(', ')} by occupation, ownership or full drishti.`
        : isKeyGraha
          ? `The ${levelWord(p.level)} lord ${p.lord} is itself one of the career grahas of this chart, though it touches no artha bhava directly.`
          : `The ${levelWord(p.level)} lord ${p.lord} touches no artha bhava (2/6/10/11) by occupation, ownership or full drishti.`,
      careerTouch.length > 0 || isKeyGraha ? 'SUPPORTING' : 'NEUTRAL',
      p.evidenceIds,
    ));
  }
  if (dashaClaims.some((c) => c.contentType !== 'NOT_CALCULATED')) resolved.add('DASHA_ACTIVATION');
  else missing.push({ factor: 'DASHA_ACTIVATION', reason: 'No active dasha lord could be profiled.' });

  /* 13 — transits ------------------------------------------------------ */
  transitClaims.push(notCalculated(
    'CAREER_TRANSIT',
    'Gochara (transit) activation is not part of this report.',
    'The kernel can compute transits, but no transit rule set has been validated for this product, and a transit reading dated to the moment of generation would make the report non-deterministic.',
  ));
  missing.push({ factor: 'TRANSIT_ACTIVATION', reason: 'Gochara rules are not validated for this report.' });

  /* --- conclusion ----------------------------------------------------- */
  const support = supportive.length;
  const challenge = challenging.length;
  const net = support - challenge;
  const natalIndication: StructuredConclusion['natalIndication'] =
    resolved.size === 0 ? 'NOT_ASSESSED'
    : net >= 3 ? 'STRONG'
    : net >= 1 ? 'MODERATE'
    : net === 0 ? 'MIXED'
    : 'LIMITED';

  const activationSupport = dashaClaims.filter((c) => c.polarity === 'SUPPORTING').length;
  const currentActivation: StructuredConclusion['currentActivation'] =
    !anyActivation ? 'LIMITED'
    : activationSupport >= 3 ? 'STRONG'
    : activationSupport >= 2 ? 'MODERATE'
    : 'MIXED';

  const statements: StructuredConclusion['statements'] = [];
  if (tenth && tenthLord) {
    statements.push({
      text: `Career is read here from the 10th bhava in ${tenth.signName}, its lord ${tenthLord}, and the grahas that occupy or aspect it.`,
      evidenceIds: [FACT.houseSignId(10), FACT.houseSignLord(10)],
    });
  }
  if (support > 0) {
    statements.push({
      text: `${support} factor(s) support the karma bhava and ${challenge} work against it; both lists are printed in full above so the balance can be checked rather than trusted.`,
      evidenceIds: [...supportive.slice(0, 3).flatMap((c) => c.evidenceIds)],
    });
  }
  statements.push({
    text: `Under the running ${activation.current.mahadasha} mahadasha / ${activation.current.antardasha} antardasha, the career reading is activated to the degree listed under Dasha Activation — the period states timing, not outcome.`,
    evidenceIds: [FACT.currentMahadasha, FACT.currentAntardasha],
  });

  const coverage = resolved.size / CAREER_FACTORS.length;

  const conclusion: StructuredConclusion = {
    contentType: 'INTERPRETIVE_SYNTHESIS',
    system: 'PARASHARI',
    statements,
    natalIndication,
    currentActivation,
    explicitlyNotClaimed: [
      'No profession, employer, salary, promotion or business outcome is named.',
      'No date of a career event is given.',
      'Evidence coverage is the fraction of the declared factor checklist that produced evidence. It is not a probability of success.',
      'D10, shadbala and transits did not contribute to this reading.',
    ],
  };

  const confidence: ConfidenceReport = {
    evidenceCoverage: coverage,
    ruleAgreement:
      challenge === 0 && support > 0 ? 'The resolved factors agree; none contradicts the others.'
      : support === 0 && challenge > 0 ? 'The resolved factors agree in the negative direction.'
      : support > 0 && challenge > 0 ? `The factors disagree: ${support} supporting against ${challenge} challenging. Both are listed; neither is suppressed.`
      : 'Too few factors resolved to speak of agreement.',
    birthTimeSensitivity:
      'The 10th bhava, its lord and every bhava-based factor above depend on the lagna, which moves about one degree every four minutes. ' +
      'If the recorded birth time is uncertain by more than roughly two minutes, the bhava-based factors should be re-checked before use.',
    missingFactors: missing,
    resolvedFactors: [...resolved].sort(),
    declaredFactors: CAREER_FACTORS.length,
  };

  return {
    domain: 'CAREER',
    engineVersion: CAREER_SYNTHESIS_VERSION,
    system: 'PARASHARI',
    natalPromise,
    supportiveFactors: supportive,
    challengingFactors: challenging,
    mixedFactors: mixed,
    vargaConfirmation,
    dashaActivation: dashaClaims,
    transitActivation: transitClaims,
    conclusion,
    confidence,
  };
}
