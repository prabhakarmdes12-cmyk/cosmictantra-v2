/**
 * KUNDLI OVERVIEW ADAPTER — READ-ONLY presentation layer.
 *
 * Sprint B.1 §5: transform engine structured data into a safe consumer
 * presentation model. This module:
 *
 *   - performs NO Jyotish calculation, NO planetary maths, NO rule evaluation;
 *   - imports engine TYPES only (type-only imports — no engine code runs here);
 *   - maps engine statuses verbatim: it never promotes VALIDATION_PENDING to
 *     CALCULATED, never rewrites NOT_CALCULATED as absent, and never infers a
 *     missing observation;
 *   - marks every pattern INTERPRETIVE_SYNTHESIS → scholarJudgementRequired.
 *
 * Status vocabulary (Sprint B.1 §4/§5):
 *   VALIDATED                all backing capabilities CALCULATED + no gaps
 *   VALIDATION_PENDING       engine evidence exists but is not fully trusted
 *   SCHOLAR_JUDGEMENT_REQUIRED  engine itself labelled the claim interpretive
 *   UNAVAILABLE              the engine evidence does not exist for this input
 */

import type { KundliCanonicalModel } from '@/lib/kundli/types';
import type { KundliDerivedModel, CapabilityRecord } from '@/lib/kundli/v40/derivedModel';
import type {
  ContentType,
  EvidenceClaim,
  EvidencePolarity,
  StructuredConclusion,
} from '@/lib/kundli/v40/contentTypes';

/* ------------------------------------------------------------------ */
/* Consumer presentation types                                         */
/* ------------------------------------------------------------------ */

export type PatternRepresentation =
  | 'STRONGLY_REPRESENTED'
  | 'REPRESENTED'
  | 'MIXED'
  | 'WEAKLY_REPRESENTED'
  | 'UNRESOLVED';

export type PatternValidationStatus =
  | 'VALIDATED'
  | 'VALIDATION_PENDING'
  | 'SCHOLAR_JUDGEMENT_REQUIRED'
  | 'UNAVAILABLE';

export interface EvidenceNodePresentation {
  id: string;
  /** Engine-authored statement. Never fabricated by UI/adapter. */
  statement: string;
  contentType: ContentType;
  polarity: EvidencePolarity;
  evidenceIds: string[];
  notCalculatedReason?: string;
}

export interface KundliOverviewPattern {
  /** Stable id the UI uses for i18n keys and data-testid. */
  id: string;
  category: 'CAREER' | 'DASHA' | 'STRUCTURE';
  /** i18n key — the UI translates; the adapter never writes prose labels. */
  titleKey: string;
  representation: PatternRepresentation;
  /** Engine-authored summary lines (interprets engine texts, never new ones). */
  summaryTexts: string[];
  evidenceNodes: EvidenceNodePresentation[];
  validationStatus: PatternValidationStatus;
  scholarJudgementRequired: boolean;
  unavailableReason?: string;
  source: {
    engineVersion: string;
    capabilityIds: string[];
  };
}

export interface DomainAvailability {
  domainId: 'CAREER' | 'DASHA' | 'STRUCTURE';
  status: 'AVAILABLE' | 'UNAVAILABLE';
  reason: string;
}

export interface KundliOverviewPresentation {
  /** False when there is no engine input at all. */
  available: boolean;
  overallStatus: 'READY' | 'UNAVAILABLE' | 'VALIDATION_PENDING';
  patterns: KundliOverviewPattern[];
  domains: DomainAvailability[];
  /** Passthrough of engine capability records (read-only view for Explorer/Scholar). */
  capabilities: CapabilityRecord[];
  d10: {
    status: string;
    note: string;
    mayInfluenceConclusions: boolean;
  } | null;
}

/* ------------------------------------------------------------------ */
/* Declared mapping tables (no computation)                            */
/* ------------------------------------------------------------------ */

const NATAL_INDICATION_TO_REPRESENTATION: Record<StructuredConclusion['natalIndication'], PatternRepresentation> = {
  STRONG: 'STRONGLY_REPRESENTED',
  MODERATE: 'REPRESENTED',
  MIXED: 'MIXED',
  LIMITED: 'WEAKLY_REPRESENTED',
  NOT_ASSESSED: 'UNRESOLVED',
};

const capabilityById = (capabilities: CapabilityRecord[]): Map<string, CapabilityRecord> =>
  new Map(capabilities.map((c) => [c.id, c]));

function statusForCapabilities(capabilityIds: string[], capabilities: CapabilityRecord[]): PatternValidationStatus {
  const byId = capabilityById(capabilities);
  const blockers = capabilityIds.filter((id) => {
    const cap = byId.get(id);
    // A capability that is absent from the declaration is a blocker: we cannot
    // claim trust for something the build never declared.
    return !cap || cap.status !== 'CALCULATED';
  });
  if (blockers.length > 0) return 'VALIDATION_PENDING';
  return 'VALIDATED';
}

function claimToNode(claim: EvidenceClaim): EvidenceNodePresentation {
  return {
    id: claim.id,
    statement: claim.statement,
    contentType: claim.contentType,
    polarity: claim.polarity,
    evidenceIds: claim.evidenceIds,
    notCalculatedReason: claim.notCalculatedReason,
  };
}

/* ------------------------------------------------------------------ */
/* Pattern builders                                                    */
/* ------------------------------------------------------------------ */

function buildCareerPattern(derived: KundliDerivedModel): KundliOverviewPattern | null {
  const career = derived.career;
  if (!career) return null;

  // Backing capabilities: what the career synthesis is allowed to rest on.
  const capabilityIds = [
    'CAP_POSITIONS',
    'CAP_HOUSES',
    'CAP_D1',
    'CAP_D9',
    'CAP_D10',
    'CAP_DASHA',
    'CAP_YOGAS',
    'CAP_ASPECTS',
    'CAP_FUNCTIONAL',
    'CAP_COMBUSTION',
    'CAP_VARGOTTAMA',
  ];
  let validationStatus = statusForCapabilities(capabilityIds, derived.capabilities);

  // Gaps declared by the engine (missingFactors is engine-authored).
  if (career.confidence.missingFactors.length > 0) {
    validationStatus = 'VALIDATION_PENDING';
  }

  const scholarJudgementRequired = career.conclusion.contentType === 'INTERPRETIVE_SYNTHESIS';

  const evidenceNodes: EvidenceNodePresentation[] = [
    ...career.supportiveFactors,
    ...career.challengingFactors,
    ...career.mixedFactors,
    ...career.vargaConfirmation,
    ...career.dashaActivation,
    ...career.transitActivation,
  ].map(claimToNode);

  return {
    id: 'CAREER',
    category: 'CAREER',
    titleKey: 'pattern.career',
    representation: NATAL_INDICATION_TO_REPRESENTATION[career.conclusion.natalIndication] ?? 'UNRESOLVED',
    summaryTexts: career.conclusion.statements.map((s) => s.text),
    evidenceNodes,
    validationStatus,
    scholarJudgementRequired,
    source: {
      engineVersion: career.engineVersion,
      capabilityIds,
    },
  };
}

function buildDashaPattern(derived: KundliDerivedModel): KundliOverviewPattern | null {
  const dasha = derived.dasha;
  if (!dasha) return null;

  // The engine cross-checks its own balance derivation. A failed cross-check
  // is an explicit engine-declared trust problem — surfaced, never hidden.
  const crossCheck = dasha.balanceAtBirth.crossCheck;
  const capabilityIds = ['CAP_DASHA', 'CAP_POSITIONS', 'CAP_FUNCTIONAL'];
  let validationStatus = statusForCapabilities(capabilityIds, derived.capabilities);
  if (crossCheck.agreesWithinOneDay === false) {
    validationStatus = 'VALIDATION_PENDING';
  }

  const nodes: EvidenceNodePresentation[] = [
    ...dasha.profiles.map((p) => ({
      id: `DASHA_${p.level}_${p.lord || 'UNKNOWN'}`,
      statement: p.functionalStatement ?? p.notCalculatedReason ?? '',
      contentType: p.contentType,
      polarity: 'NEUTRAL' as EvidencePolarity,
      evidenceIds: p.evidenceIds ?? [],
      notCalculatedReason: p.notCalculatedReason,
    })),
    ...dasha.overlappingThemes.map((t, i) => ({
      id: `DASHA_OVERLAP_${i}`,
      statement: t.statement,
      contentType: 'DERIVED_JYOTISH_FACT' as ContentType,
      polarity: 'NEUTRAL' as EvidencePolarity,
      evidenceIds: t.evidenceIds ?? [],
    })),
  ].filter((n) => n.statement);

  return {
    id: 'DASHA',
    category: 'DASHA',
    titleKey: 'pattern.dasha',
    // The adapter must NOT grade dasha strength — the engine exposes facts and
    // an explicit timing note, not a strength verdict.
    representation: 'UNRESOLVED',
    summaryTexts: dasha.timingNote ? [dasha.timingNote] : [],
    evidenceNodes: nodes,
    validationStatus,
    scholarJudgementRequired: false,
    source: {
      engineVersion: dasha.engineVersion,
      capabilityIds,
    },
  };
}

function buildStructurePattern(canonical: KundliCanonicalModel, derived: KundliDerivedModel): KundliOverviewPattern | null {
  if (!derived.highlights.length) return null;

  const capabilityIds = [
    'CAP_POSITIONS',
    'CAP_HOUSES',
    'CAP_D1',
    'CAP_D9',
    'CAP_ASPECTS',
    'CAP_FUNCTIONAL',
    'CAP_COMBUSTION',
    'CAP_VARGOTTAMA',
    'CAP_YOGAS',
  ];
  const validationStatus = statusForCapabilities(capabilityIds, derived.capabilities);

  return {
    id: 'STRUCTURE',
    category: 'STRUCTURE',
    titleKey: 'pattern.structure',
    // Highlights are observations, not a verdict: representation stays
    // UNRESOLVED unless the engine produces a graded structure conclusion.
    representation: 'UNRESOLVED',
    summaryTexts: [],
    evidenceNodes: derived.highlights.map((h) => ({
      id: h.id,
      statement: h.statement,
      contentType: h.contentType,
      polarity: 'NEUTRAL' as EvidencePolarity,
      evidenceIds: h.evidenceIds,
    })),
    validationStatus,
    scholarJudgementRequired: false,
    source: {
      engineVersion: derived.version,
      capabilityIds,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Public entry                                                        */
/* ------------------------------------------------------------------ */

export interface KundliOverviewAdapterInput {
  canonical?: KundliCanonicalModel | null;
  derived?: KundliDerivedModel | null;
}

/**
 * READ-ONLY transform. Takes whatever the engine produced and maps it into
 * the consumer presentation model. Missing inputs produce UNAVAILABLE
 * records — never invented ones.
 */
export function adaptKundliOverview(input: KundliOverviewAdapterInput): KundliOverviewPresentation {
  const { canonical, derived } = input;

  if (!canonical && !derived) {
    return {
      available: false,
      overallStatus: 'UNAVAILABLE',
      patterns: [],
      domains: [
        { domainId: 'CAREER', status: 'UNAVAILABLE', reason: 'No engine input provided.' },
        { domainId: 'DASHA', status: 'UNAVAILABLE', reason: 'No engine input provided.' },
        { domainId: 'STRUCTURE', status: 'UNAVAILABLE', reason: 'No engine input provided.' },
      ],
      capabilities: [],
      d10: null,
    };
  }

  const capabilities = derived?.capabilities ?? [];
  const patterns: KundliOverviewPattern[] = [];
  const domains: DomainAvailability[] = [];

  if (canonical && derived) {
    const career = buildCareerPattern(derived);
    domains.push({
      domainId: 'CAREER',
      status: derived.career ? 'AVAILABLE' : 'UNAVAILABLE',
      reason: derived.career ? 'Engine produced a career synthesis.' : 'Engine produced no career synthesis for this input.',
    });
    if (career) patterns.push(career);

    const dasha = buildDashaPattern(derived);
    domains.push({
      domainId: 'DASHA',
      status: derived.dasha ? 'AVAILABLE' : 'UNAVAILABLE',
      reason: derived.dasha ? 'Engine produced a dasha activation profile.' : 'Engine produced no dasha activation profile for this input.',
    });
    if (dasha) patterns.push(dasha);

    const structure = buildStructurePattern(canonical, derived);
    domains.push({
      domainId: 'STRUCTURE',
      status: derived.highlights.length > 0 ? 'AVAILABLE' : 'UNAVAILABLE',
      reason: derived.highlights.length > 0 ? 'Engine produced structural highlights.' : 'Engine produced no structural highlights for this input.',
    });
    if (structure) patterns.push(structure);
  } else {
    domains.push(
      { domainId: 'CAREER', status: 'UNAVAILABLE', reason: 'Adapter requires both canonical and derived engine models.' },
      { domainId: 'DASHA', status: 'UNAVAILABLE', reason: 'Adapter requires both canonical and derived engine models.' },
      { domainId: 'STRUCTURE', status: 'UNAVAILABLE', reason: 'Adapter requires both canonical and derived engine models.' },
    );
  }

  const overallStatus =
    patterns.length === 0
      ? 'UNAVAILABLE'
      : patterns.some((p) => p.validationStatus !== 'VALIDATED')
        ? 'VALIDATION_PENDING'
        : 'READY';

  return {
    available: patterns.length > 0,
    overallStatus,
    patterns,
    domains,
    capabilities,
    d10: derived?.d10?.promotion
      ? {
          status: derived.d10.promotion.status,
          note: derived.d10.promotion.reason,
          mayInfluenceConclusions: derived.d10.promotion.mayInfluenceConclusions,
        }
      : null,
  };
}
