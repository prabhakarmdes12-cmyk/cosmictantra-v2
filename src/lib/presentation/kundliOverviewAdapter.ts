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

/* ------------------------------------------------------------------ */
/* Sprint C — consumer at-a-glance / WHAT-IS-ACTIVE-NOW / WHY evidence */
/* Same read-only contract: engine fields are mapped verbatim. No      */
/* calculation, no inference, no translation (i18n keys only).         */
/* ------------------------------------------------------------------ */

import type { StoredKundliRecord } from '@/lib/jyotish/kundliStore';

export type ConsumerChartState =
  | 'DRAFT'
  | 'INPUT_INCOMPLETE'
  | 'CALCULATED'
  | 'VALIDATION_PENDING'
  | 'READY'
  | 'FAILED';

export interface ChartStateResult {
  state: ConsumerChartState;
  /** Human-neutral reasons (i18n keys) for the state. */
  reasons: string[];
}

export interface AtAGlanceField {
  /** Engine value, verbatim. null = the engine did not produce it. */
  value: string | null;
  /** i18n key for the field label. */
  labelKey: string;
  /** True when the record is a preset/benchmark chart rather than user-created. */
  readonly?: boolean;
}

export interface KundliAtAGlance {
  lagna: AtAGlanceField;
  moonRashi: AtAGlanceField;
  nakshatra: AtAGlanceField & { pada: string | null; lord: string | null };
  mahadasha: AtAGlanceField & { dates: string | null };
  antardasha: AtAGlanceField;
  periodString: string | null;
  engineVersion: string | null;
  ayanamshaName: string | null;
  calculatedAt: string | null;
  timeConfidence: 'EXACT' | 'APPROXIMATE' | 'UNKNOWN' | null;
}

export interface DashaWhyStep {
  /** i18n key under `conversion.whySteps`. */
  textKey: string;
  /** Engine values interpolated by the UI. Never assembled into a claim here. */
  values: Record<string, string>;
  /** Which claim grammar chip the UI may show (truthful only). */
  claim: 'CALCULATED' | 'DERIVED' | 'VALIDATION_PENDING';
}

export interface DashaTechnicalEvidence {
  moonLongitude: string | null;
  moonDegreeStr: string | null;
  startingBalance: string | null;
  engineVersion: string | null;
  ayanamshaName: string | null;
  ayanamshaValue: number | null;
  astronomyProvider: { providerId: string | null; kernel: string | null; validationStatus: string | null };
  conventionSummaryLines: string[];
}

const moonFrom = (record: StoredKundliRecord): any =>
  (record.snapshot.planetsArray || (record.snapshot.planets as any[]) || []).find((p: any) => p.name === 'Moon') || null;

function strOrNull(v: unknown): string | null {
  return v === null || v === undefined || v === '' ? null : String(v);
}

/**
 * Maps a stored engine record into the consumer "at a glance" model.
 * Every value is read straight from the engine snapshot; missing values
 * stay null and the UI must render them as unavailable, never invent them.
 */
export function adaptKundliAtAGlance(record: StoredKundliRecord | null): KundliAtAGlance | null {
  if (!record || !record.snapshot) return null;
  const s = record.snapshot;
  const moon = moonFrom(record);
  const nak = s.birthPanchang?.nakshatra;
  return {
    lagna: { value: strOrNull(s.lagna?.rashiName), labelKey: 'lagna' },
    moonRashi: { value: strOrNull(moon?.rashiName) || strOrNull(s.birthPanchang?.moon?.rashiName), labelKey: 'moonRashi' },
    nakshatra: {
      value: strOrNull(nak?.name),
      labelKey: 'nakshatra',
      pada: strOrNull(nak?.pada),
      lord: strOrNull(nak?.lord) || strOrNull(nak?.nakshatraLord),
    },
    mahadasha: {
      value: strOrNull(s.dasha?.currentMahadasha),
      labelKey: 'currentMahadasha',
      dates: strOrNull(s.dasha?.currentDateRange),
    },
    antardasha: { value: strOrNull(s.dasha?.currentAntardasha), labelKey: 'currentAntardasha' },
    periodString: strOrNull(s.dasha?.currentPeriodString),
    engineVersion: strOrNull(s.meta?.engineVersion),
    ayanamshaName: strOrNull(s.meta?.ayanamshaName),
    calculatedAt: strOrNull(s.meta?.calculatedAt),
    timeConfidence: record.timeConfidence || null,
  };
}

/**
 * Progressive WHY evidence for the CURRENT dasha only (Sprint C §10).
 * Steps map engine fields verbatim; the UI translates and interpolates.
 */
export function buildDashaWhyEvidence(record: StoredKundliRecord): DashaWhyStep[] {
  const s = record.snapshot;
  const steps: DashaWhyStep[] = [];
  const nak = s.birthPanchang?.nakshatra;
  const moon = moonFrom(record);

  if (nak?.name) {
    steps.push({
      textKey: 'whyMoonNakshatra',
      values: { nakshatra: String(nak.name) },
      claim: 'CALCULATED',
    });
  }
  if (nak?.lord) {
    steps.push({
      textKey: 'whyNakshatraLord',
      values: { nakshatra: String(nak.name), lord: String(nak.lord) },
      claim: 'CALCULATED',
    });
  }
  if (s.dasha?.startingBalance) {
    steps.push({
      textKey: 'whyBalance',
      values: { balance: String(s.dasha.startingBalance) },
      claim: 'CALCULATED',
    });
  }
  const mds = (s.dasha?.mahadashas || []).slice(0, 5).map((m: any) => ({
    lord: strOrNull(m.lord),
    start: strOrNull(m.startFormatted),
    end: strOrNull(m.endFormatted),
  }));
  if (mds.length > 0) {
    steps.push({
      textKey: 'whySequence',
      values: { sequence: mds.map((m: any) => `${m.lord} (${m.start}–${m.end})`).join(' · ') },
      claim: 'CALCULATED',
    });
  }
  if (s.dasha?.currentMahadasha) {
    steps.push({
      textKey: 'whyMahadasha',
      values: {
        lord: String(s.dasha.currentMahadasha),
        dates: strOrNull(s.dasha.currentDateRange) || '',
      },
      claim: 'CALCULATED',
    });
  }
  if (s.dasha?.currentAntardasha) {
    steps.push({
      textKey: 'whyAntardasha',
      values: { lord: String(s.dasha.currentAntardasha) },
      claim: 'CALCULATED',
    });
  }
  if (record.timeConfidence && record.timeConfidence !== 'EXACT') {
    steps.push({
      textKey: 'whyTimeUncertain',
      values: { confidence: String(record.timeConfidence) },
      claim: 'VALIDATION_PENDING',
    });
  }
  if (moon) {
    steps.push({
      textKey: 'whyMoonDetail',
      values: {
        degree: strOrNull(moon.degreeStr) || (Number.isFinite(Number(moon.longitude)) ? `${Number(moon.longitude).toFixed(2)}°` : ''),
        rashi: strOrNull(moon.rashiName) || '',
      },
      claim: 'CALCULATED',
    });
  }
  return steps;
}

/** Technical (monospace) evidence — engine values verbatim, never derived. */
export function buildDashaTechnicalEvidence(record: StoredKundliRecord): DashaTechnicalEvidence {
  const s = record.snapshot;
  const moon = moonFrom(record);
  return {
    moonLongitude: Number.isFinite(Number(moon?.longitude)) ? String(Number(moon.longitude).toFixed(6)) : null,
    moonDegreeStr: strOrNull(moon?.degreeStr),
    startingBalance: strOrNull(s.dasha?.startingBalance),
    engineVersion: strOrNull(s.meta?.engineVersion),
    ayanamshaName: strOrNull(s.meta?.ayanamshaName),
    ayanamshaValue: Number.isFinite(Number(s.meta?.ayanamshaValue)) ? Number(s.meta.ayanamshaValue) : null,
    astronomyProvider: {
      providerId: strOrNull(s.meta?.astronomyProvider?.providerId),
      kernel: strOrNull(s.meta?.astronomyProvider?.kernel),
      validationStatus: strOrNull(s.meta?.astronomyProvider?.validationStatus),
    },
    conventionSummaryLines: Array.isArray(s.meta?.conventionRegistry?.summaryLines)
      ? (s.meta.conventionRegistry.summaryLines as string[])
      : [],
  };
}

/**
 * ONE canonical consumer chart state (§31). Maps declared engine statuses
 * only: a record is VALIDATION_PENDING when the engine declares non-EXACT
 * time confidence or a non-VALIDATED astronomy layer.
 */
export function deriveConsumerChartState(record: StoredKundliRecord | null): ChartStateResult {
  if (!record) {
    return { state: 'FAILED', reasons: ['stateChartMissing'] };
  }
  const bc = record.birthContext;
  if (!bc || !bc.birthDate || !bc.birthTime || !Number.isFinite(bc.latitude) || !Number.isFinite(bc.longitude)) {
    return { state: 'INPUT_INCOMPLETE', reasons: ['stateInputIncomplete'] };
  }
  const s = record.snapshot;
  if (!s || !s.lagna || !s.dasha || !s.birthPanchang || !Array.isArray(s.planetsArray)) {
    return { state: 'FAILED', reasons: ['stateSnapshotMissing'] };
  }
  const reasons: string[] = [];
  if (record.timeConfidence && record.timeConfidence !== 'EXACT') {
    reasons.push(record.timeConfidence === 'APPROXIMATE' ? 'stateApproximateTime' : 'stateUnknownTime');
  }
  const providerStatus = s.meta?.astronomyProvider?.validationStatus;
  // Read-only mapping of the engine's own qualification vocabulary: the
  // kernel reports INTERNALLY_VERIFIED / VALIDATED as trustworthy states;
  // anything else declared by the engine is NOT trusted for consumer READY.
  const VERIFIED_ASTRONOMY_STATUSES = new Set(['VALIDATED', 'INTERNALLY_VERIFIED']);
  if (providerStatus && !VERIFIED_ASTRONOMY_STATUSES.has(providerStatus)) {
    reasons.push('stateProviderPending');
  }
  return {
    state: reasons.length > 0 ? 'VALIDATION_PENDING' : 'READY',
    reasons,
  };
}
