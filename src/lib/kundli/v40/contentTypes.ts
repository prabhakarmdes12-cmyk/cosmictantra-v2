/**
 * KUNDLI V40 — content-type vocabulary (KUNDLI_INV_002).
 *
 * Every object that can reach a reader carries one of these tags. A tag is
 * not decoration: the renderer draws a different marker for each, and the
 * semantic acceptance suite asserts that no INTERPRETIVE_SYNTHESIS is ever
 * presented inside a factual table.
 */

export type ContentType =
  | 'CALCULATED_FACT'        // produced by the astronomical kernel
  | 'DERIVED_JYOTISH_FACT'   // pure rule-derivation over calculated facts
  | 'TRADITIONAL_RULE'       // a declared classical rule and its verdict
  | 'INTERPRETIVE_SYNTHESIS' // reasoning over facts + rules
  | 'PRACTICAL_REFLECTION'   // human guidance, never a prediction
  | 'NOT_CALCULATED';        // explicitly absent, with a reason

/** KUNDLI_INV_004 — no silent tradition mixing. */
export type JyotishSystem = 'PARASHARI' | 'JAIMINI' | 'KP' | 'NON_TRADITIONAL';

/**
 * Verification state of a capability.
 *
 *  CALCULATED          computed and covered by a regression fixture.
 *  VALIDATION_PENDING  computed, but not yet trusted enough to influence a
 *                      conclusion. Rendered, labelled, never used.
 *  NOT_CALCULATED      not computed at all. Never rewritten as ABSENT.
 */
export type CapabilityStatus = 'CALCULATED' | 'VALIDATION_PENDING' | 'NOT_CALCULATED';

export type EvidencePolarity = 'SUPPORTING' | 'CHALLENGING' | 'MIXED' | 'NEUTRAL';

/**
 * One traceable claim.
 *
 * `evidenceIds` are canonical fact paths (see ./factPaths.ts) that resolve
 * against the KundliCanonicalModel, or rule ids of the form `RULE:<id>`.
 * The data-lineage suite mechanically resolves every one of them.
 */
export interface EvidenceClaim {
  id: string;
  contentType: ContentType;
  system: JyotishSystem;
  /** One sentence, in the report's own words. */
  statement: string;
  polarity: EvidencePolarity;
  evidenceIds: string[];
  /** Present only when contentType === 'NOT_CALCULATED'. */
  notCalculatedReason?: string;
}

export interface ConfidenceReport {
  /** Fraction of the declared factor checklist that produced a resolved claim. */
  evidenceCoverage: number;
  /** Human statement of how the factors agree. Never a probability. */
  ruleAgreement: string;
  birthTimeSensitivity?: string;
  /** Factors the domain declares but could not evaluate, with reasons. */
  missingFactors: { factor: string; reason: string }[];
  /** Factors that did produce evidence. Named, so coverage can be audited. */
  resolvedFactors: string[];
  /** Size of the declared checklist — the denominator of evidenceCoverage. */
  declaredFactors: number;
}

export interface StructuredConclusion {
  contentType: 'INTERPRETIVE_SYNTHESIS';
  system: JyotishSystem;
  /** Short headline statements, each backed by claims already listed. */
  statements: { text: string; evidenceIds: string[] }[];
  /** Qualitative reading of the natal indication. Never a probability. */
  natalIndication: 'STRONG' | 'MODERATE' | 'MIXED' | 'LIMITED' | 'NOT_ASSESSED';
  /** Qualitative reading of what the running dasha activates. */
  currentActivation: 'STRONG' | 'MODERATE' | 'MIXED' | 'LIMITED' | 'NOT_ASSESSED';
  /** Things this conclusion deliberately does not say. */
  explicitlyNotClaimed: string[];
}

/** Statuses rendered with a glyph rather than a colour (B/W safety, §31). */
export const STATUS_GLYPH: Record<string, string> = {
  PRESENT: '\u2713',           // ✓
  ABSENT: '\u2717',            // ✗
  INDETERMINATE: '\u25C7',     // ◇
  SCHOLAR_JUDGEMENT: '\u25C7', // ◇
  NOT_CALCULATED: '\u2014',    // —
  VALIDATION_PENDING: '\u25CB',// ○
};

export const CONTENT_TYPE_MARK: Record<ContentType, string> = {
  CALCULATED_FACT: 'FACT',
  DERIVED_JYOTISH_FACT: 'DERIVED',
  TRADITIONAL_RULE: 'RULE',
  INTERPRETIVE_SYNTHESIS: 'READING',
  PRACTICAL_REFLECTION: 'REFLECTION',
  NOT_CALCULATED: 'NOT CALCULATED',
};
