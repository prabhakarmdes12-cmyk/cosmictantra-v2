/**
 * CLASSICAL RULE REGISTRY — Sprint H (charter §14: "one of CosmicTantra's core assets").
 *
 * Every classical rule the engine applies is registered here as a structured
 * object with the charter's field set:
 *   id, sanskritName, englishName, category, tradition, source, sourceLocator,
 *   sourceVerification, originalText, translation, adoptedInterpretation,
 *   alternateInterpretations[], prerequisites[], evaluator, evidencePaths[],
 *   validationStatus, scholarReviews[], version.
 *
 * HONESTY POLICY (mirrors yogaSourceRegistry.ts):
 *   - This repository holds NO licensed Jyotish edition. No verse or chapter
 *     locator has been checked against an edition we hold. `originalText` and
 *     `translation` are therefore NEVER filled with reconstructed verses; they
 *     carry explicit unverified-status statements instead.
 *   - `sourceVerification` is restricted to the charter's four allowed
 *     statuses: SOURCE_VERIFIED | SOURCE_SECONDARY | ATTRIBUTION_UNVERIFIED |
 *     SOURCE_PENDING. SOURCE_VERIFIED cannot be registered while
 *     REPO_HOLDS_LICENSED_EDITIONS is false — registration fails closed.
 *   - `adoptedInterpretation` (exactly what the code does) is the only
 *     authoritative field.
 *
 * Validation status follows the CT_INV_005 ladder plus an explicit honest zero:
 *   IMPLEMENTED < INTERNALLY_VERIFIED < EXTERNALLY_VERIFIED < SCHOLAR_VERIFIED
 *   NOT_IMPLEMENTED — the rule is registered but deliberately not computed
 *   (its results surface as NOT_CALCULATED per CT_INV_006, never as a guess).
 *
 * CT_INV_007: registration is static and deterministic; the registry
 * fingerprint is a pure content hash with no timestamps.
 */

import * as crypto from 'crypto';
import {
  YOGA_SOURCE_REGISTRY,
  YOGA_SOURCE_REGISTRY_VERSION,
  type YogaSourceEntry
} from './yogaSourceRegistry';

export const CLASSICAL_RULE_REGISTRY_VERSION = 'classical-rule-registry-1.0.0 (sprint H)';
export const CLASSICAL_RULE_REGISTRY_DOC = 'docs/reference-grade/10-sprint-h-rule-registry-provenance.md';

/** Charter §14: the only allowed source-verification statuses. */
export type SourceVerificationStatus =
  | 'SOURCE_VERIFIED'
  | 'SOURCE_SECONDARY'
  | 'ATTRIBUTION_UNVERIFIED'
  | 'SOURCE_PENDING';

/** CT_INV_005 validation ladder + the explicit NOT_IMPLEMENTED zero state. */
export type RuleValidationStatus =
  | 'NOT_IMPLEMENTED'
  | 'IMPLEMENTED'
  | 'INTERNALLY_VERIFIED'
  | 'EXTERNALLY_VERIFIED'
  | 'SCHOLAR_VERIFIED';

/** The repo-wide honesty constant: flip to true ONLY when a licensed edition is actually added. */
export const REPO_HOLDS_LICENSED_EDITIONS = false;

export interface ScholarReview {
  reviewer: string;
  reviewedAtUtc: string;
  verdict: string;
  notes: string;
}

export interface ClassicalRule {
  id: string;
  sanskritName: string;
  englishName: string;
  category:
    | 'GRAHA_CONDITION'
    | 'RELATIONSHIP'
    | 'TRANSIT'
    | 'DOSHA'
    | 'YOGA'
    | 'DIGNITY'
    | 'DASHA'
    | 'DEFINITION_CANDIDATE';
  /** The tradition stream the adopted reading is drawn from (declared, never silently mixed — CT_INV_003). */
  tradition: string;
  source: string;
  sourceLocator: string;
  sourceVerification: SourceVerificationStatus;
  /** NEVER a reconstructed verse while REPO_HOLDS_LICENSED_EDITIONS is false. */
  originalText: string;
  translation: string;
  /** The exact rule the code implements — the only authoritative field. */
  adoptedInterpretation: string;
  /** Readings this implementation does NOT apply (declared disagreement, CT_INV_004). */
  alternateInterpretations: string[];
  prerequisites: string[];
  /** Code pointer: 'path::symbol' or 'path::section'. */
  evaluator: string;
  evidencePaths: string[];
  validationStatus: RuleValidationStatus;
  adoption: 'ADOPTED' | 'NOT_ADOPTED';
  scholarReviews: ScholarReview[];
  version: string;
}

export class RuleRegistryError extends Error {
  constructor(
    public readonly errorCode:
      | 'RULE_INVALID'
      | 'RULE_DUPLICATE'
      | 'SOURCE_STATUS_DISALLOWED'
      | 'SOURCE_VERIFIED_IMPOSSIBLE'
      | 'EXTERNAL_CLAIM_UNEVIDENCED',
    message: string,
    public readonly detail: Record<string, unknown>
  ) {
    super(message);
    this.name = 'RuleRegistryError';
  }
}

const SOURCE_VERIFICATION_STATUSES: readonly SourceVerificationStatus[] = [
  'SOURCE_VERIFIED', 'SOURCE_SECONDARY', 'ATTRIBUTION_UNVERIFIED', 'SOURCE_PENDING'
];

const registry = new Map<string, ClassicalRule>();

/** Fail-closed registration (CT_INV_006): an invalid rule aborts, never silently degrades. */
export function registerClassicalRule(rule: ClassicalRule): ClassicalRule {
  if (!rule.id || !/^[A-Z][A-Z0-9_]+$/.test(rule.id)) {
    throw new RuleRegistryError('RULE_INVALID', 'Rule id must be non-empty UPPER_SNAKE_CASE', { id: rule.id });
  }
  if (registry.has(rule.id)) {
    throw new RuleRegistryError('RULE_DUPLICATE', 'Rule id already registered', { id: rule.id });
  }
  if (!rule.sanskritName || !rule.englishName) {
    throw new RuleRegistryError('RULE_INVALID', 'sanskritName and englishName are required (use an explicit unrecorded marker, not an invention)', { id: rule.id });
  }
  if (!SOURCE_VERIFICATION_STATUSES.includes(rule.sourceVerification)) {
    throw new RuleRegistryError('SOURCE_STATUS_DISALLOWED', `sourceVerification must be one of ${SOURCE_VERIFICATION_STATUSES.join(' | ')}`, { id: rule.id, received: rule.sourceVerification });
  }
  if (rule.sourceVerification === 'SOURCE_VERIFIED' && !REPO_HOLDS_LICENSED_EDITIONS) {
    throw new RuleRegistryError(
      'SOURCE_VERIFIED_IMPOSSIBLE',
      'SOURCE_VERIFIED requires a licensed edition held in this repository (REPO_HOLDS_LICENSED_EDITIONS = false). Downgrade to SOURCE_SECONDARY / ATTRIBUTION_UNVERIFIED / SOURCE_PENDING.',
      { id: rule.id }
    );
  }
  if (!rule.adoptedInterpretation || rule.adoptedInterpretation.trim().length < 10) {
    throw new RuleRegistryError('RULE_INVALID', 'adoptedInterpretation is required — it is the only authoritative field', { id: rule.id });
  }
  if (!rule.evaluator || !rule.evaluator.includes('::')) {
    throw new RuleRegistryError('RULE_INVALID', 'evaluator must be a code pointer of the form path::symbol', { id: rule.id, received: rule.evaluator });
  }
  if ((rule.validationStatus === 'EXTERNALLY_VERIFIED' || rule.validationStatus === 'SCHOLAR_VERIFIED')) {
    const hasQualificationEvidence = rule.evidencePaths.some((p) => p.startsWith('qualification/') || p.startsWith('docs/reference-grade/'));
    if (!hasQualificationEvidence) {
      throw new RuleRegistryError('EXTERNAL_CLAIM_UNEVIDENCED', 'EXTERNALLY_VERIFIED / SCHOLAR_VERIFIED require evidence in qualification/ or docs/reference-grade/ (CT_INV_005: never label results validated without a recorded verification)', { id: rule.id, evidencePaths: rule.evidencePaths });
    }
  }
  if (rule.adoption === 'NOT_ADOPTED' && rule.validationStatus !== 'NOT_IMPLEMENTED') {
    throw new RuleRegistryError('RULE_INVALID', 'a NOT_ADOPTED rule must carry validationStatus NOT_IMPLEMENTED (nothing computes it)', { id: rule.id });
  }
  const frozen: ClassicalRule = Object.freeze({
    ...rule,
    alternateInterpretations: Object.freeze([...rule.alternateInterpretations]),
    prerequisites: Object.freeze([...rule.prerequisites]),
    evidencePaths: Object.freeze([...rule.evidencePaths]),
    scholarReviews: Object.freeze([...rule.scholarReviews])
  }) as ClassicalRule;
  registry.set(rule.id, frozen);
  return frozen;
}

export function getClassicalRule(id: string): ClassicalRule | undefined {
  ensureClassicalRulesSeeded();
  return registry.get(id);
}

export function listClassicalRules(): ClassicalRule[] {
  ensureClassicalRulesSeeded();
  return [...registry.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function classicalRuleCount(): number {
  ensureClassicalRulesSeeded();
  return registry.size;
}

/** Deterministic content fingerprint (CT_INV_007 / CT_INV_008). */
export function classicalRuleRegistryFingerprint(): string {
  ensureClassicalRulesSeeded();
  const payload = listClassicalRules().map((r) => ({
    id: r.id, version: r.version, category: r.category, tradition: r.tradition,
    source: r.source, sourceLocator: r.sourceLocator, sourceVerification: r.sourceVerification,
    originalText: r.originalText, translation: r.translation,
    adoptedInterpretation: r.adoptedInterpretation,
    alternateInterpretations: r.alternateInterpretations,
    prerequisites: r.prerequisites, evaluator: r.evaluator, evidencePaths: r.evidencePaths,
    validationStatus: r.validationStatus, adoption: r.adoption
  }));
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

/** conventionCenter-style metadata stamp for canonicalSnapshot.meta (additive). */
export function buildRuleRegistrySnapshotMetadata(): {
  ruleRegistry: {
    registryVersion: string;
    registryDoc: string;
    fingerprint: string;
    ruleCount: number;
    statusSummary: Record<string, number>;
    sourceStatusSummary: Record<string, number>;
  };
} {
  const rules = listClassicalRules();
  const statusSummary: Record<string, number> = {};
  const sourceStatusSummary: Record<string, number> = {};
  for (const r of rules) {
    statusSummary[r.validationStatus] = (statusSummary[r.validationStatus] ?? 0) + 1;
    sourceStatusSummary[r.sourceVerification] = (sourceStatusSummary[r.sourceVerification] ?? 0) + 1;
  }
  return {
    ruleRegistry: {
      registryVersion: CLASSICAL_RULE_REGISTRY_VERSION,
      registryDoc: CLASSICAL_RULE_REGISTRY_DOC,
      fingerprint: classicalRuleRegistryFingerprint(),
      ruleCount: rules.length,
      statusSummary,
      sourceStatusSummary
    }
  };
}

/* ------------------------------------------------------------------------- */
/* Seed registrations — the engine's classical rules, wrapped not duplicated.  */
/* ------------------------------------------------------------------------- */

const LOCATOR_UNVERIFIED =
  'NOT VERIFIED — no licensed Jyotish edition is held in this repository; locator is a provenance claim pending verification.';
const NO_ORIGINAL_TEXT =
  'NOT RECORDED — the repository holds no licensed source text; quoting a reconstructed verse would violate the no-invented-citations rule.';
const PARASHARA_TRADITION = 'Parashari (BPHS-attributed mainstream Jyotish) — attribution not verified against a licensed edition';

function seedRegistry(): void {
  registerClassicalRule({
    id: 'RULE_COMBUSTION_ORBS',
    sanskritName: 'Asta (ग्रह अस्त)',
    englishName: 'Planetary combustion by angular distance from the Sun',
    category: 'GRAHA_CONDITION',
    tradition: PARASHARA_TRADITION,
    source: 'Classical combustion corpus (RSK_002): commonly cited per-planet orbs; texts disagree on Mercury (14° vs 12° retrograde) and Venus (10°/8°)',
    sourceLocator: 'NOT VERIFIED — no licensed edition held; see COMBUSTION_ORB_TABLE_V2 (relationshipEngine.ts)',
    sourceVerification: 'SOURCE_SECONDARY',
    originalText: NO_ORIGINAL_TEXT,
    translation: NO_ORIGINAL_TEXT,
    adoptedInterpretation: 'A graha is combust when its geocentric angular separation from the Sun ≤ the adopted orb for its state: Moon 12°, Mars 17°, Mercury 14° (12° if retrograde), Jupiter 11°, Venus 10° (8° if retrograde), Saturn 15°. Separation ≤ orb/3 is DEEP_COMBUST; separation ≤ orb+2° is NEAR_COMBUST (display band). Separation within ±1° of the adopted orb sets borderline = scholarJudgementRequired = true (RSK_002): the verdict depends on which classical orb is adopted and must not be presented as settled. Sun, Rahu and Ketu are not subject to asta (applicable = false).',
    alternateInterpretations: [
      'Mercury 14° in both states (the RSK_002 example reading).',
      'Venus 10° in both states.',
      'Some traditions exempt the Moon from combustion altogether.'
    ],
    prerequisites: ['Geocentric sidereal longitudes of the graha and the Sun', 'Retrograde state of the graha (where the adopted orb is state-dependent)'],
    evaluator: 'src/lib/jyotish/relationshipEngine.ts::checkCombustion',
    evidencePaths: [
      'src/lib/jyotish/relationshipEngine.ts',
      'src/lib/jyotish/ruleRegistry.ts',
      'qualification/rule-registry-qualification-runner.ts',
      'docs/reference-grade/10-sprint-h-rule-registry-provenance.md'
    ],
    validationStatus: 'INTERNALLY_VERIFIED',
    adoption: 'ADOPTED',
    scholarReviews: [],
    version: '2.0.0'
  });

  registerClassicalRule({
    id: 'RULE_GRAHA_YUDDHA_1DEG',
    sanskritName: 'Graha Yuddha (ग्रह युद्ध)',
    englishName: 'Planetary war between taragrahas within one degree',
    category: 'GRAHA_CONDITION',
    tradition: PARASHARA_TRADITION,
    source: 'Commonly cited classical planetary-war rule (taragrahas only, 1° separation)',
    sourceLocator: 'NOT VERIFIED — no licensed edition held',
    sourceVerification: 'SOURCE_SECONDARY',
    originalText: NO_ORIGINAL_TEXT,
    translation: NO_ORIGINAL_TEXT,
    adoptedInterpretation: 'A planetary war exists between two of Mars/Mercury/Jupiter/Venus/Saturn when their geocentric angular separation is ≤ 1° (60 arcminutes). The one with the smaller declination (norther) wins; equality falls to the smaller longitude. Sun/Moon/nodes do not participate.',
    alternateInterpretations: [
      'Some texts admit only Mercury, Venus, Jupiter, Mars, Saturn AND use longitude-based victory instead of declination.',
      'Orb variants (e.g. 1° exact vs < 1°) appear in commentaries.'
    ],
    prerequisites: ['Geocentric longitudes and declinations of the five taragrahas'],
    evaluator: 'src/lib/jyotish/relationshipEngine.ts::checkPlanetaryWar',
    evidencePaths: ['src/lib/jyotish/relationshipEngine.ts', 'src/lib/jyotish/ruleRegistry.ts'],
    validationStatus: 'IMPLEMENTED',
    adoption: 'ADOPTED',
    scholarReviews: [],
    version: '1.0.0'
  });

  registerClassicalRule({
    id: 'RULE_TATKALIKA_MAITRI',
    sanskritName: 'Tatkalika Maitri (तात्कालिक मैत्री)',
    englishName: 'Temporary friendship from mutual house placement',
    category: 'RELATIONSHIP',
    tradition: PARASHARA_TRADITION,
    source: 'Commonly cited temporary-friendship rule (houses 2/3/4/10/11/12 from a planet = friend)',
    sourceLocator: 'NOT VERIFIED — no licensed edition held',
    sourceVerification: 'SOURCE_SECONDARY',
    originalText: NO_ORIGINAL_TEXT,
    translation: NO_ORIGINAL_TEXT,
    adoptedInterpretation: 'Planets in the 2nd, 3rd, 4th, 10th, 11th or 12th house (rashi) from a planet are its temporary friends (Mitra); planets in the 1st, 5th, 6th, 7th, 8th or 9th are its temporary enemies (Shatru). Determined per planet pair from whole-sign distance.',
    alternateInterpretations: ['Some commentators split 2/3/4 vs 10/11/12 into different friendship grades; this engine adopts the binary form.'],
    prerequisites: ['Rashi placement of both planets'],
    evaluator: 'src/lib/jyotish/relationshipEngine.ts::getTatkalikaMaitri',
    evidencePaths: ['src/lib/jyotish/relationshipEngine.ts', 'src/lib/jyotish/ruleRegistry.ts'],
    validationStatus: 'IMPLEMENTED',
    adoption: 'ADOPTED',
    scholarReviews: [],
    version: '1.0.0'
  });

  registerClassicalRule({
    id: 'RULE_PANCHADHA_MAITRI',
    sanskritName: 'Panchadha Maitri (पंचधा मैत्री)',
    englishName: 'Five-fold (compound) friendship',
    category: 'RELATIONSHIP',
    tradition: PARASHARA_TRADITION,
    source: 'Standard compound of natural (Naisargika) and temporary (Tatkalika) friendship tables',
    sourceLocator: 'NOT VERIFIED — no licensed edition held',
    sourceVerification: 'SOURCE_SECONDARY',
    originalText: NO_ORIGINAL_TEXT,
    translation: NO_ORIGINAL_TEXT,
    adoptedInterpretation: 'Compound friendship = natural friendship combined with temporary friendship, yielding five grades: ATI_MITRA (great friend), MITRA (friend), SAMA (neutral), SHATRU (enemy), ATI_SHATRU (great enemy). The compound matrix lives in getPanchadhaMaitri and is recomputed for every planet pair in the canonical snapshot.',
    alternateInterpretations: ['Edge-case compounds (enemy+friend etc.) are resolved per the matrix in code; alternative resolutions exist in commentaries.'],
    prerequisites: ['RULE_NAISARGIKA_MAITRI', 'RULE_TATKALIKA_MAITRI'],
    evaluator: 'src/lib/jyotish/relationshipEngine.ts::getPanchadhaMaitri',
    evidencePaths: ['src/lib/jyotish/relationshipEngine.ts', 'src/lib/jyotish/ruleRegistry.ts'],
    validationStatus: 'IMPLEMENTED',
    adoption: 'ADOPTED',
    scholarReviews: [],
    version: '1.0.0'
  });

  registerClassicalRule({
    id: 'RULE_NAISARGIKA_MAITRI',
    sanskritName: 'Naisargika Maitri (नैसर्गिक मैत्री)',
    englishName: 'Natural friendship of the grahas',
    category: 'RELATIONSHIP',
    tradition: PARASHARA_TRADITION,
    source: 'Standard natural-friendship table (dispositor-based)',
    sourceLocator: 'NOT VERIFIED — no licensed edition held',
    sourceVerification: 'SOURCE_SECONDARY',
    originalText: NO_ORIGINAL_TEXT,
    translation: NO_ORIGINAL_TEXT,
    adoptedInterpretation: 'Natural friendship is determined from each graha\'s permanent friends/neutrals/enemies by rashi lordship, the classical table as coded in relationshipEngine (NaisargikaMaitri); it feeds the Panchadha compound.',
    alternateInterpretations: ['Minor table variants exist for Mercury-Sun and Moon-Mars relationships across commentaries.'],
    prerequisites: ['Graha rashi placements'],
    evaluator: 'src/lib/jyotish/relationshipEngine.ts::getPanchadhaMaitri (NaisargikaMaitri table)',
    evidencePaths: ['src/lib/jyotish/relationshipEngine.ts', 'src/lib/jyotish/ruleRegistry.ts'],
    validationStatus: 'IMPLEMENTED',
    adoption: 'ADOPTED',
    scholarReviews: [],
    version: '1.0.0'
  });

  registerClassicalRule({
    id: 'RULE_SADE_SATI_BAND',
    sanskritName: 'Sade Sati (साढ़े साती)',
    englishName: "Saturn's seven-and-a-half-year transit through 12th/1st/2nd from the natal Moon",
    category: 'TRANSIT',
    tradition: PARASHARA_TRADITION,
    source: 'Commonly cited Sade Sati band (12th, 1st, 2nd rashis from the natal Moon; nominal 7.5y)',
    sourceLocator: 'NOT VERIFIED — no licensed edition held; band + convention evidence in GOCHARA_ENGINE_BENCHMARK_001',
    sourceVerification: 'SOURCE_SECONDARY',
    originalText: NO_ORIGINAL_TEXT,
    translation: NO_ORIGINAL_TEXT,
    adoptedInterpretation: 'Sade Sati is a TRANSIT phenomenon (charter §9): transit Saturn within whole-sign houses 12, 1 or 2 counted from the NATAL MOON rashi, evaluated at an explicit reference instant — never inferred from natal Saturn (RSK_016). Phases: 1st (Rising, 12th), Peak (Janma, 1st), 3rd (Setting, 2nd). Period endpoints are solved from the certified ephemeris with all retrograde oscillations captured; firstExitUtc (the published-panchang end convention) and periodEndUtc (strict band-membership end) are both reported.',
    alternateInterpretations: [
      'End-date convention: published panchangs end Sade Sati at the FIRST departure from the 2nd-from rashi; strict band membership extends through a retrograde dip back into the band. Both are reported; neither is hidden.',
      'Nominal 7.5y is a mean: real spans vary ~6.4-8.3y with Saturn per-rashi speeds (measured against published spans).'
    ],
    prerequisites: ['Natal Moon rashi', 'Transit Saturn sidereal longitude at the reference instant'],
    evaluator: 'src/lib/jyotish/gocharaEngine.ts::computeGochara + computeSadeSatiPeriod',
    evidencePaths: [
      'src/lib/jyotish/gocharaEngine.ts',
      'qualification/gochara-summary.json',
      'docs/reference-grade/09-sprint-g-gochara-sade-sati.md'
    ],
    validationStatus: 'EXTERNALLY_VERIFIED',
    adoption: 'ADOPTED',
    scholarReviews: [],
    version: '1.0.0'
  });

  registerClassicalRule({
    id: 'RULE_DHAIYA_4_8',
    sanskritName: 'Dhaiya / Ardhashtama Shani (ढैया / अर्धाष्टम शनि)',
    englishName: "Saturn's small panoti through the 4th and 8th from the natal Moon",
    category: 'TRANSIT',
    tradition: PARASHARA_TRADITION,
    source: 'Commonly cited Dhaiya rule (4th and 8th from natal Moon)',
    sourceLocator: 'NOT VERIFIED — no licensed edition held',
    sourceVerification: 'SOURCE_SECONDARY',
    originalText: NO_ORIGINAL_TEXT,
    translation: NO_ORIGINAL_TEXT,
    adoptedInterpretation: 'Dhaiya is active when transit Saturn occupies the 4th or 8th whole-sign house from the natal Moon rashi, evaluated at the explicit reference instant. Tracked separately from Sade Sati (a graha can be in both).',
    alternateInterpretations: ['Some traditions count additional small-panoti variants (e.g. from the Lagna); not adopted.'],
    prerequisites: ['Natal Moon rashi', 'Transit Saturn placement'],
    evaluator: 'src/lib/jyotish/gocharaEngine.ts::computeGochara (dhaiya)',
    evidencePaths: ['src/lib/jyotish/gocharaEngine.ts', 'qualification/gochara-summary.json'],
    validationStatus: 'INTERNALLY_VERIFIED',
    adoption: 'ADOPTED',
    scholarReviews: [],
    version: '1.0.0'
  });

  registerClassicalRule({
    id: 'RULE_PARASHARI_SPECIAL_ASPECTS',
    sanskritName: 'Parashari Drishti — vishesha drishti (विशेष दृष्टि)',
    englishName: 'Special aspects of Mars (4/8), Jupiter (5/9) and Saturn (3/10)',
    category: 'GRAHA_CONDITION',
    tradition: PARASHARA_TRADITION,
    source: 'Commonly cited Parashari special-aspect houses',
    sourceLocator: 'NOT VERIFIED — no licensed edition held',
    sourceVerification: 'SOURCE_SECONDARY',
    originalText: NO_ORIGINAL_TEXT,
    translation: NO_ORIGINAL_TEXT,
    adoptedInterpretation: 'All grahas aspect the 7th house; Mars additionally aspects the 4th and 8th, Jupiter the 5th and 9th, Saturn the 3rd and 10th (whole-sign house distances). For transits the engine evaluates these distances onto the natal Lagna and Moon rashis; for natal charts the GrahaDrishti engine applies them with shashtiamsha-weighted strength.',
    alternateInterpretations: ['Rahu/Ketu aspectation (e.g. 5/9 per some commentators) is NOT adopted.'],
    prerequisites: ['Whole-sign house distances'],
    evaluator: 'src/lib/jyotish/gocharaEngine.ts::computeGochara (specialAspectsOnNatal) + src/lib/jyotish/relationshipEngine.ts (GrahaDrishti)',
    evidencePaths: ['src/lib/jyotish/gocharaEngine.ts', 'src/lib/jyotish/relationshipEngine.ts', 'qualification/gochara-summary.json'],
    validationStatus: 'INTERNALLY_VERIFIED',
    adoption: 'ADOPTED',
    scholarReviews: [],
    version: '1.0.0'
  });

  registerClassicalRule({
    id: 'RULE_MANGLIK_HOUSES',
    sanskritName: 'Manglik / Kuja Dosha (मांगलिक / कुज दोष)',
    englishName: 'Mars-in-sensitive-houses dosha with classical cancellations',
    category: 'DOSHA',
    tradition: 'South-Indian Kuja Dosha tradition + North-Indian Manglik usage — both commonly cited; attribution not verified against a licensed edition',
    source: 'Commonly cited Manglik house rule (1, 2, 4, 7, 8, 12 in various traditions; this engine adopts 1, 4, 7, 8, 12 from the Lagna)',
    sourceLocator: 'NOT VERIFIED — no licensed edition held',
    sourceVerification: 'ATTRIBUTION_UNVERIFIED',
    originalText: NO_ORIGINAL_TEXT,
    translation: NO_ORIGINAL_TEXT,
    adoptedInterpretation: 'Manglik is flagged when natal Mars occupies house 1, 4, 7, 8 or 12 from the Lagna (whole-sign). Severity: HIGH for houses 7 and 8, MEDIUM otherwise; classical cancellation rules are evaluated and reported with the flag (isCancelled + cancellationReason). Humane, non-fear language per RSK_008.',
    alternateInterpretations: [
      'The 2nd house is included by several South-Indian traditions; not adopted here.',
      'Some traditions assess Manglik from the Moon or Venus as well; Lagna-only is adopted.'
    ],
    prerequisites: ['Natal Mars house from the Lagna'],
    evaluator: 'src/lib/jyotish/canonicalSnapshot.ts::yogasAndDoshas.manglik',
    evidencePaths: ['src/lib/jyotish/canonicalSnapshot.ts', 'src/lib/jyotish/ruleRegistry.ts'],
    validationStatus: 'IMPLEMENTED',
    adoption: 'ADOPTED',
    scholarReviews: [],
    version: '1.0.0'
  });

  registerClassicalRule({
    id: 'RULE_KALSARPA_VARIANTS',
    sanskritName: 'Kala Sarpa Yoga/Dosha (काल सर्प)',
    englishName: 'Kalsarpa — candidate definitions, none adopted',
    category: 'DEFINITION_CANDIDATE',
    tradition: 'Multiple conflicting traditions (full-hemisphere vs edge-inclusive; Rahu-inclusive vs axis-only; exclusion of the Lagna varies)',
    source: 'Candidate definitions collected for Sprint I; the engine exposes NO kalsarpa verdict while variants conflict',
    sourceLocator: 'NOT VERIFIED — no licensed edition held',
    sourceVerification: 'ATTRIBUTION_UNVERIFIED',
    originalText: NO_ORIGINAL_TEXT,
    translation: NO_ORIGINAL_TEXT,
    adoptedInterpretation: 'VARIANT REGISTER (not itself a computed rule): the contested Kalsarpa axes are (a) strict one-hemisphere containment vs boundary-rashi inclusion; (b) direction-qualified vs either arc; (c) Moon counted vs excluded; (d) Anant/Vasuki twelve-name typing. Sprint I ADOPTED one reading as RULE_KALSARPA_HEMISPHERE (doshaEngine.ts::evaluateKalsarpa): all seven grahas within one node-bounded hemisphere, either arc accepted, boundary-rashi placement INDETERMINATE, naming NOT_CALCULATED. The remaining variant readings stay declared alternatives on every result.',
    alternateInterpretations: [
      'Full vs partial hemispheric containment.',
      'Rahu-Ketu axis counted as containing boundaries or not.',
      'Type naming by node-head rashi (12 classical names).'
    ],
    prerequisites: ['A formally adopted variant (Sprint I)'],
    evaluator: 'src/lib/jyotish/canonicalSnapshot.ts::yogasAndDoshas.kalsarpa (NOT_CALCULATED by design)',
    evidencePaths: ['src/lib/jyotish/canonicalSnapshot.ts', 'src/lib/jyotish/ruleRegistry.ts'],
    validationStatus: 'NOT_IMPLEMENTED',
    adoption: 'NOT_ADOPTED',
    scholarReviews: [],
    version: '0.1.0'
  });

  registerClassicalRule({
    id: 'RULE_KALSARPA_HEMISPHERE',
    sanskritName: 'Kala Sarpa (काल सर्प)',
    englishName: 'Kalsarpa — all grahas within one node-bounded hemisphere (ADOPTED variant)',
    category: 'DOSHA',
    tradition: PARASHARA_TRADITION,
    source: 'One-hemisphere node-axis reading adopted in Sprint I from the variant axes registered as RULE_KALSARPA_VARIANTS; competing readings declared as alternatives',
    sourceLocator: 'NOT VERIFIED — no licensed edition held; adopted variant + alternatives declared on every result (doshaEngine.ts)',
    sourceVerification: 'SOURCE_SECONDARY',
    originalText: NO_ORIGINAL_TEXT,
    translation: NO_ORIGINAL_TEXT,
    adoptedInterpretation: 'Kalsarpa is PRESENT when all seven visible grahas (Sun..Saturn, nodes excluded as the boundary) occupy one closed half of the zodiac bounded by the Rahu-Ketu axis; the arc direction is recorded (RAHU_TO_KETU / KETU_TO_RAHU) but either qualifies. A graha sharing a rashi with a node makes the verdict INDETERMINATE (boundary placement contested — never guessed). The twelve Anant/Vasuki names are NOT_CALCULATED. Direction-qualified, Kala-Amrita and Moon-exclusion readings are declared alternatives.',
    alternateInterpretations: [
      'Direction-qualified: only the Rahu-to-Ketu arc qualifies.',
      'Boundary-inclusive: grahas in the node rashis still count inside.',
      'Kala Amrita as a separate mirrored verdict.',
      'Moon excluded from the counted grahas.'
    ],
    prerequisites: ['Rashi of all seven grahas', 'Rahu/Ketu rashis (structurally opposite)'],
    evaluator: 'src/lib/jyotish/doshaEngine.ts::evaluateKalsarpa',
    evidencePaths: ['src/lib/jyotish/doshaEngine.ts', 'src/lib/jyotish/ruleRegistry.ts', 'qualification/yoga-summary.json'],
    validationStatus: 'INTERNALLY_VERIFIED',
    adoption: 'ADOPTED',
    scholarReviews: [],
    version: '1.0.0'
  });

  registerClassicalRule({
    id: 'RULE_VIMSHOTTARI_ORDER',
    sanskritName: 'Vimshottari Dasha (विंशोत्तरी दशा)',
    englishName: '120-year Vimshottari planetary period sequence',
    category: 'DASHA',
    tradition: PARASHARA_TRADITION,
    source: 'Standard 120-year order and lord years (Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16, Saturn 19, Mercury 17, Ketu 7, Venus 20)',
    sourceLocator: 'NOT VERIFIED — no licensed edition held; implementation qualified in TIME_ENGINE_BENCHMARK_001',
    sourceVerification: 'SOURCE_SECONDARY',
    originalText: NO_ORIGINAL_TEXT,
    translation: NO_ORIGINAL_TEXT,
    adoptedInterpretation: 'The 120-year Vimshottari sequence starting from the birth-star lord, with sub-periods (antardasha/pratyantardasha) in proportional continuation. Sprint E qualification: 5.14M boundary comparisons against an independent classical implementation, 0 mismatches.',
    alternateInterpretations: ['Year-length conventions (365.25-day solar vs 360-day savana) — the engine\'s adopted convention is declared in the convention registry.'],
    prerequisites: ['Natal Moon nakshatra'],
    evaluator: 'src/lib/engines/dashaEngine.ts::calculateVimshottariDasha',
    evidencePaths: ['src/lib/engines/dashaEngine.ts', 'qualification/time-summary.json', 'docs/reference-grade/07-sprint-e-time-qualification.md'],
    validationStatus: 'EXTERNALLY_VERIFIED',
    adoption: 'ADOPTED',
    scholarReviews: [],
    version: '1.0.0'
  });

  registerClassicalRule({
    id: 'RULE_EXALTATION_DEBILITATION_POINTS',
    sanskritName: 'Uchha / Neecha (उच्च / नीच)',
    englishName: 'Exaltation and debilitation degrees of the grahas',
    category: 'DIGNITY',
    tradition: PARASHARA_TRADITION,
    source: 'Standard exaltation/debilitation degree table (Sun 10 Aries / 10 Libra ... Saturn 20 Aries / 20 Libra)',
    sourceLocator: 'NOT VERIFIED — no licensed edition held; table frozen in BALA_ENGINE_BENCHMARK_001',
    sourceVerification: 'SOURCE_SECONDARY',
    originalText: NO_ORIGINAL_TEXT,
    translation: NO_ORIGINAL_TEXT,
    adoptedInterpretation: 'Debilitation points (sidereal degrees): Sun 190, Moon 213, Mars 118, Mercury 345, Jupiter 275, Venus 177, Saturn 20 — exaltation is the diametric opposite. Deep exaltation uses the classical per-planet degree zones. Used by dignity display and Shadbala Sthana Bala (Sprint F identity-checked 5.25M comparisons).',
    alternateInterpretations: ['Deep-exaltation degree values vary by a degree or two across commentaries for some grahas.'],
    prerequisites: ['Sidereal longitudes'],
    evaluator: 'src/lib/jyotish/balaEngine.ts::DEBILITATION_POINTS + src/lib/astrologyEngine.js::dignity',
    evidencePaths: ['src/lib/jyotish/balaEngine.ts', 'qualification/bala-summary.json', 'docs/reference-grade/bala-certification.md'],
    validationStatus: 'INTERNALLY_VERIFIED',
    adoption: 'ADOPTED',
    scholarReviews: [],
    version: '1.0.0'
  });

  registerClassicalRule({
    id: 'RULE_MOOLATRIKONA_ZONES',
    sanskritName: 'Moolatrikona (मूलत्रिकोण)',
    englishName: 'Moolatrikona zones of the grahas',
    category: 'DIGNITY',
    tradition: PARASHARA_TRADITION,
    source: 'Standard Moolatrikona zone table (frozen in BALA_ENGINE_BENCHMARK_001)',
    sourceLocator: 'NOT VERIFIED — no licensed edition held',
    sourceVerification: 'SOURCE_SECONDARY',
    originalText: NO_ORIGINAL_TEXT,
    translation: NO_ORIGINAL_TEXT,
    adoptedInterpretation: 'A graha in the first N degrees of its Moolatrikona rashi (per the frozen MOOLATRIKONA_ZONES table, e.g. Sun Leo 0-20°, Moon Taurus 0-3°, Mars Aries 0-15°) scores Moolatrikona dignity; beyond the zone boundary the classical next-best dignity applies.',
    alternateInterpretations: ['Zone boundaries are the commonly cited ones; some commentaries differ by degrees on Mars/Jupiter zones.'],
    prerequisites: ['Sidereal longitude in-sign'],
    evaluator: 'src/lib/jyotish/balaEngine.ts::MOOLATRIKONA_ZONES',
    evidencePaths: ['src/lib/jyotish/balaEngine.ts', 'qualification/bala-summary.json'],
    validationStatus: 'INTERNALLY_VERIFIED',
    adoption: 'ADOPTED',
    scholarReviews: [],
    version: '1.0.0'
  });
}

let seeded = false;

/** Idempotent seed of the core rules (call before reading the registry). */
export function ensureClassicalRulesSeeded(): void {
  if (seeded) return;
  seedRegistry();
  for (const adapted of rulesFromYogaSourceRegistry()) {
    registerClassicalRule(adapted);
  }
  seeded = true;
}

/* ------------------------------------------------------------------------- */
/* Yoga cross-link — the registry is the umbrella, yogaSourceRegistry the text */
/* ------------------------------------------------------------------------- */

/**
 * Adapt every yogaSourceRegistry entry into the unified registry WITHOUT
 * duplicating its text: the source work, locator, honesty flags, adopted
 * interpretation and variants flow through unchanged.
 */
export function rulesFromYogaSourceRegistry(): ClassicalRule[] {
  return Object.values(YOGA_SOURCE_REGISTRY).map((entry: YogaSourceEntry): ClassicalRule => ({
    id: entry.ruleId,
    sanskritName: '(not separately recorded — see yogaSourceRegistry entry)',
    englishName: entry.ruleId.replace(/^YOGA_/, '').replace(/_/g, ' ').toLowerCase(),
    category: 'YOGA',
    tradition: `As recorded in yogaSourceRegistry.ts (v1): ${entry.sourceWork}`,
    source: entry.sourceWork,
    sourceLocator: entry.locator,
    sourceVerification: 'ATTRIBUTION_UNVERIFIED',
    originalText: NO_ORIGINAL_TEXT,
    translation: NO_ORIGINAL_TEXT,
    adoptedInterpretation: entry.adoptedInterpretation,
    alternateInterpretations: [...entry.variants],
    prerequisites: ['Natal chart (yogaChart)'],
    evaluator: 'src/lib/jyotish/yogaEngine.ts::evaluateYogas',
    evidencePaths: ['src/lib/jyotish/yogaSourceRegistry.ts', 'src/lib/jyotish/yogaEngine.ts'],
    validationStatus: entry.adoption === 'ADOPTED' ? 'IMPLEMENTED' : 'NOT_IMPLEMENTED',
    adoption: entry.adoption,
    scholarReviews: [],
    version: '1.0.0 (from ' + YOGA_SOURCE_REGISTRY_VERSION + ')'
  }));
}
