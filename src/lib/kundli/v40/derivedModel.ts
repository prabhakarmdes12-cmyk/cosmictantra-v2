/**
 * KUNDLI V40 — derived model assembler.
 *
 * ONE object built from the canonical model by declared rules. Everything the
 * V40 report may draw comes from here or from the canonical model directly;
 * the renderer never reaches past it.
 *
 * KUNDLI_INV_001 — nothing in this file, or anything it calls, computes a
 * planetary position. Every number originates in the canonical model.
 */

import type { KundliCanonicalModel } from '../types';
import { buildFunctionalLordship, type FunctionalLordship, FUNCTIONAL_LORDSHIP_ENGINE_VERSION } from './functionalLordship';
import { buildAspects, DEFAULT_ASPECT_POLICY, type AspectEngineResult, type AspectPolicy } from './aspectEngine';
import { buildGrahaConditions, type GrahaConditionResult, GRAHA_CONDITION_ENGINE_VERSION } from './grahaCondition';
import { buildBhavaIntelligence, type BhavaIntelligenceResult, BHAVA_INTELLIGENCE_VERSION } from './bhavaIntelligence';
import { buildDashaActivation, type DashaActivation, DASHA_ACTIVATION_VERSION } from './dashaActivation';
import { buildStructuralHighlights, type StructuralHighlight, STRUCTURAL_HIGHLIGHTS_VERSION } from './structuralHighlights';
import { buildCareerSynthesis, type JyotishSynthesis, CAREER_SYNTHESIS_VERSION } from './careerSynthesis';
import { buildDiscussionPoints, type DiscussionPoint, CONSULTATION_QUESTIONS_VERSION } from './consultationQuestions';
import { buildPanchangaIdentity, type PanchangaIdentity, PANCHANGA_IDENTITY_VERSION } from './panchangaIdentity';
import { validateD10, type D10ValidationReport, D10_PROMOTION } from './d10Validation';
import type { CapabilityStatus } from './contentTypes';

export const DERIVED_MODEL_VERSION = 'kundli-derived-v1';

export interface CapabilityRecord {
  id: string;
  name: string;
  status: CapabilityStatus;
  note: string;
  /**
   * Whether any conclusion in the report is permitted to rest on this
   * capability. Anything that is not fully CALCULATED is barred, which is what
   * keeps shadbala and the unvalidated vargas out of the reasoning path.
   */
  mayInfluenceConclusions: boolean;
}

/** Declaration shape used inside the builder; the flag is derived, not typed by hand. */
type CapabilityDeclaration = Omit<CapabilityRecord, 'mayInfluenceConclusions'> & {
  mayInfluenceConclusions?: boolean;
};

export interface KundliDerivedModel {
  version: string;
  engineVersions: Record<string, string>;
  aspectPolicy: AspectPolicy;

  panchanga: PanchangaIdentity;
  functionalLordship: FunctionalLordship[];
  aspects: AspectEngineResult;
  grahaConditions: GrahaConditionResult;
  bhavas: BhavaIntelligenceResult;
  dasha: DashaActivation;
  highlights: StructuralHighlight[];
  career: JyotishSynthesis;
  discussionPoints: DiscussionPoint[];
  d10: D10ValidationReport;

  /** Everything this build does and does not calculate, in one place. */
  capabilities: CapabilityRecord[];
}

export function buildDerivedModel(
  canonical: KundliCanonicalModel,
  options: { aspectPolicy?: AspectPolicy } = {},
): KundliDerivedModel {
  const aspectPolicy = options.aspectPolicy ?? DEFAULT_ASPECT_POLICY;
  const aspects = buildAspects(canonical, aspectPolicy);
  const grahaConditions = buildGrahaConditions(canonical, { aspectPolicy, aspects });
  const bhavas = buildBhavaIntelligence(canonical, { aspectPolicy, aspects });
  const dasha = buildDashaActivation(canonical, grahaConditions);
  const highlights = buildStructuralHighlights(canonical, grahaConditions, bhavas);
  const career = buildCareerSynthesis(canonical, grahaConditions, bhavas, dasha);
  const discussionPoints = buildDiscussionPoints(canonical, grahaConditions, bhavas, dasha, career);
  const panchanga = buildPanchangaIdentity(canonical);
  const d10 = validateD10(canonical);

  const declaredCapabilities: CapabilityDeclaration[] = [
    { id: 'CAP_POSITIONS', name: 'Sidereal graha positions (Lahiri, mean node)', status: 'CALCULATED', note: 'Kernel calculation; covered by the astronomical regression fixture.' },
    { id: 'CAP_HOUSES', name: 'Whole-sign bhavas', status: 'CALCULATED', note: 'Equal-sign houses counted from the lagna.' },
    { id: 'CAP_PANCHANGA', name: 'Panchanga at birth', status: 'CALCULATED', note: 'Tithi, nakshatra, yoga, karana, ayana, ritu, samvat.' },
    { id: 'CAP_AMANTA', name: 'Amanta lunar month', status: panchanga.masa.amanta.status, note: panchanga.masa.amanta.method ?? panchanga.masa.amanta.reason ?? '' },
    { id: 'CAP_PURNIMANTA', name: 'Purnimanta lunar month', status: 'NOT_CALCULATED', note: panchanga.masa.purnimanta.reason ?? '' },
    { id: 'CAP_D1', name: 'D1 Rashi chart', status: 'CALCULATED', note: 'Cross-checked against the canonical placements by the chart gate.' },
    { id: 'CAP_D9', name: 'D9 Navamsha chart', status: 'CALCULATED', note: 'Cross-checked against an independent navamsha calculation by the chart gate.' },
    { id: 'CAP_D10', name: 'D10 Dashamsha', status: D10_PROMOTION.status, note: D10_PROMOTION.reason },
    { id: 'CAP_OTHER_VARGAS', name: 'Remaining 13 vargas', status: 'NOT_CALCULATED', note: 'Computed by the kernel, not validated, and deliberately not exposed by this report.' },
    { id: 'CAP_DASHA', name: 'Vimshottari MD / AD / PD', status: 'CALCULATED', note: 'Balance at birth re-derived at full precision and cross-checked against the engine timeline.' },
    { id: 'CAP_YOGAS', name: 'Yoga rule evaluation', status: 'CALCULATED', note: 'Only the registered rules. Unlisted yogas are not claimed absent.' },
    { id: 'CAP_ASPECTS', name: 'Parashari full graha drishti', status: 'CALCULATED', note: aspectPolicy.declaration },
    { id: 'CAP_FUNCTIONAL', name: 'Functional lordship', status: 'CALCULATED', note: 'Derived from the lagna sign and the classical sign-lord table.' },
    { id: 'CAP_COMBUSTION', name: 'Combustion (asta)', status: 'CALCULATED', note: 'Classical orb table, retrograde-aware.' },
    { id: 'CAP_VARGOTTAMA', name: 'Vargottama', status: 'CALCULATED', note: 'D1 sign compared with D9 sign.' },
    { id: 'CAP_SHADBALA', name: 'Shadbala', status: 'VALIDATION_PENDING', note: 'Computed by balaEngine; not validated against an external reference. Not exposed, not used.' },
    { id: 'CAP_BHAVA_BALA', name: 'Bhava bala', status: 'VALIDATION_PENDING', note: 'Same validation gate as shadbala.' },
    { id: 'CAP_ASHTAKAVARGA', name: 'Ashtakavarga', status: 'NOT_CALCULATED', note: 'Computed by the kernel, not validated, not exposed.' },
    { id: 'CAP_JAIMINI', name: 'Jaimini chara karakas', status: 'NOT_CALCULATED', note: 'A separate system; mixing it into a Parashari report without declaration is forbidden by KUNDLI_INV_004.' },
    { id: 'CAP_KP', name: 'KP sub-lords', status: 'NOT_CALCULATED', note: 'A separate system; not exposed by this report.' },
    { id: 'CAP_TRANSIT', name: 'Gochara (transits)', status: 'NOT_CALCULATED', note: 'Would make the report non-deterministic and is not validated.' },
    { id: 'CAP_KALSARPA', name: 'Kalsarpa dosha', status: 'CALCULATED', note: 'Adopted variant ONE_HEMISPHERE_NODE_AXIS (Sprint I); twelve-name typing NOT_CALCULATED.' },
    { id: 'CAP_PREDICTION', name: 'Event prediction', status: 'NOT_CALCULATED', note: 'Death, disease, marriage, childbirth, litigation and financial outcomes are never predicted (KUNDLI_INV_005).' },
  ];

  // A capability may inform a conclusion only if it is fully calculated. The
  // flag is derived here rather than written by hand on each entry, so a new
  // capability cannot be added in a state where it silently leaks into the
  // reasoning path.
  const capabilities: CapabilityRecord[] = declaredCapabilities.map((c) => ({
    ...c,
    mayInfluenceConclusions: c.mayInfluenceConclusions ?? c.status === 'CALCULATED',
  }));

  return {
    version: DERIVED_MODEL_VERSION,
    engineVersions: {
      derivedModel: DERIVED_MODEL_VERSION,
      grahaCondition: GRAHA_CONDITION_ENGINE_VERSION,
      bhavaIntelligence: BHAVA_INTELLIGENCE_VERSION,
      dashaActivation: DASHA_ACTIVATION_VERSION,
      structuralHighlights: STRUCTURAL_HIGHLIGHTS_VERSION,
      careerSynthesis: CAREER_SYNTHESIS_VERSION,
      consultationQuestions: CONSULTATION_QUESTIONS_VERSION,
      functionalLordship: FUNCTIONAL_LORDSHIP_ENGINE_VERSION,
      panchangaIdentity: PANCHANGA_IDENTITY_VERSION,
      aspectEngine: aspects.engineVersion,
      d10Validation: d10.version,
    },
    aspectPolicy,
    panchanga,
    functionalLordship: buildFunctionalLordship(canonical),
    aspects,
    grahaConditions,
    bhavas,
    dasha,
    highlights,
    career,
    discussionPoints,
    d10,
    capabilities,
  };
}
