/**
 * REFERENCE-GRADE SPRINT K — §19 SCHOLAR REVIEW SYSTEM.
 *
 * Charter §19: a qualified practitioner can inspect a rule/result and record
 * AGREE / DISAGREE / PARTIALLY_AGREE / ALTERNATIVE_INTERPRETATION /
 * INSUFFICIENT_EVIDENCE, together with reviewer ID, timestamp, rule version,
 * chart version, commentary and (optionally) a source reference.
 *
 * THE cardinal invariant (charter, verbatim intent):
 *   "Never overwrite computational truth with practitioner opinion. Store both."
 *
 * Therefore this store:
 *   - NEVER mutates an EvidenceStore or any node (it only reads nodes);
 *   - records the exact value digest the reviewer saw (targetValueDigest), so a
 *     later engine change auto-flags the review as VALUE_CHANGED instead of
 *     silently carrying an opinion onto a different result;
 *   - is append-only and hash-chained (CT_INV_008 tamper evidence);
 *   - fails closed with typed errors on malformed reviews.
 *
 * Reviewer identity is RECORDED, never authenticated — a review is provenance
 * of human judgement, not authority (CT_INV_005 tiers are untouched by it).
 */
import { createHash } from 'node:crypto';
import { canonicalStringify, type EvidenceNode, type EvidenceStore } from './evidenceGraph';
import { getClassicalRule } from './ruleRegistry';
import type { CompiledEvidence } from './evidenceCompiler';

export const SCHOLAR_REVIEW_VERSION = 'scholar-review-1.0.0 (sprint K)';

/** The five charter §19 verdicts — exactly these, nothing else. */
export const SCHOLAR_VERDICTS = [
  'AGREE',
  'DISAGREE',
  'PARTIALLY_AGREE',
  'ALTERNATIVE_INTERPRETATION',
  'INSUFFICIENT_EVIDENCE'
] as const;
export type ScholarVerdict = (typeof SCHOLAR_VERDICTS)[number];

/** Mission-wide allowed source statuses (CT_INV_002) — reviews may cite sources. */
export const SCHOLAR_SOURCE_STATUSES = [
  'SOURCE_VERIFIED',
  'SOURCE_SECONDARY',
  'ATTRIBUTION_UNVERIFIED',
  'SOURCE_PENDING'
] as const;
export type ScholarSourceStatus = (typeof SCHOLAR_SOURCE_STATUSES)[number];

/** Verdicts that demand an explanatory commentary (a bare disagreement is not actionable). */
const COMMENTARY_REQUIRED: readonly ScholarVerdict[] = [
  'DISAGREE',
  'PARTIALLY_AGREE',
  'ALTERNATIVE_INTERPRETATION',
  'INSUFFICIENT_EVIDENCE'
];

export interface ScholarChartVersion {
  engineVersion: string;
  snapshotHash: string;
}

export interface ScholarSource {
  citation: string;
  status: ScholarSourceStatus;
}

export interface NewScholarReview {
  targetNodeId: string;
  /** sha256 of the canonical node value AT REVIEW TIME — the freshness anchor. */
  targetValueDigest: string;
  targetSubject: string;
  /** Present when the reviewed node carries registry provenance. */
  ruleId?: string;
  ruleVersion?: string;
  chartVersion: ScholarChartVersion;
  reviewerId: string;
  /** Recorded, never verified (see header). */
  reviewerCredential?: string;
  verdict: ScholarVerdict;
  commentary: string;
  source?: ScholarSource;
  /** Reviewer-attested instant; defaults to append time. Injectable for deterministic replay. */
  reviewedAtUtc?: string;
}

export interface ScholarReviewRecord {
  reviewId: string;
  targetNodeId: string;
  targetValueDigest: string;
  targetSubject: string;
  ruleId?: string;
  ruleVersion?: string;
  chartVersion: ScholarChartVersion;
  reviewerId: string;
  reviewerCredential?: string;
  verdict: ScholarVerdict;
  commentary: string;
  source?: ScholarSource;
  reviewedAtUtc: string;
  /** Hash-chain links (CT_INV_008). */
  prevHash: string;
  recordHash: string;
}

export type ScholarReviewErrorCode =
  | 'INVALID_VERDICT'
  | 'REVIEWER_REQUIRED'
  | 'COMMENTARY_REQUIRED'
  | 'RULE_UNKNOWN'
  | 'RULE_VERSION_MISMATCH'
  | 'SOURCE_STATUS_INVALID'
  | 'NODE_SUBJECT_MISMATCH';

export class ScholarReviewError extends Error {
  readonly code: ScholarReviewErrorCode;
  readonly detail: Record<string, unknown>;
  constructor(code: ScholarReviewErrorCode, message: string, detail: Record<string, unknown> = {}) {
    super(`[SCHOLAR_REVIEW:${code}] ${message}`);
    this.name = 'ScholarReviewError';
    this.code = code;
    this.detail = detail;
  }
}

function sha256(input: string, length = 64): string {
  return createHash('sha256').update(input, 'utf8').digest('hex').slice(0, length);
}

/** The digest a review is anchored to: sha256 of the canonical node VALUE. */
export function valueDigestOf(node: EvidenceNode): string {
  return sha256(canonicalStringify(node.value), 32);
}

function validateDraft(draft: NewScholarReview): void {
  if (!SCHOLAR_VERDICTS.includes(draft.verdict)) {
    throw new ScholarReviewError('INVALID_VERDICT', `verdict must be one of ${SCHOLAR_VERDICTS.join('|')}`, { received: draft.verdict });
  }
  if (typeof draft.reviewerId !== 'string' || draft.reviewerId.trim().length === 0) {
    throw new ScholarReviewError('REVIEWER_REQUIRED', 'a non-empty reviewerId is required', { received: draft.reviewerId });
  }
  if (COMMENTARY_REQUIRED.includes(draft.verdict)) {
    if (typeof draft.commentary !== 'string' || draft.commentary.trim().length < 10) {
      throw new ScholarReviewError(
        'COMMENTARY_REQUIRED',
        `${draft.verdict} requires a substantive commentary (>= 10 chars)`,
        { verdict: draft.verdict, receivedLength: draft.commentary?.length ?? 0 }
      );
    }
  }
  if (draft.source !== undefined) {
    if (!(SCHOLAR_SOURCE_STATUSES as readonly string[]).includes(draft.source.status)) {
      throw new ScholarReviewError('SOURCE_STATUS_INVALID', `source.status must be one of ${SCHOLAR_SOURCE_STATUSES.join('|')}`, {
        received: draft.source.status
      });
    }
    if (typeof draft.source.citation !== 'string' || draft.source.citation.trim().length === 0) {
      throw new ScholarReviewError('SOURCE_STATUS_INVALID', 'source.citation must be a non-empty citation locator', {});
    }
  }
  if (draft.ruleId !== undefined) {
    const live = getClassicalRule(draft.ruleId);
    if (!live) {
      throw new ScholarReviewError('RULE_UNKNOWN', `ruleId ${draft.ruleId} is not in the classical rule registry`, { ruleId: draft.ruleId });
    }
    if (draft.ruleVersion !== undefined && draft.ruleVersion !== live.version) {
      throw new ScholarReviewError(
        'RULE_VERSION_MISMATCH',
        `rule ${draft.ruleId} is at ${live.version}; the draft pins ${draft.ruleVersion}`,
        { live: live.version, draft: draft.ruleVersion }
      );
    }
  }
}

export class ScholarReviewStore {
  private records: ScholarReviewRecord[] = [];
  private lastHash = 'SCHOLAR-GENESIS';
  public readonly chartVersion: ScholarChartVersion;

  constructor(chartVersion: ScholarChartVersion) {
    this.chartVersion = { engineVersion: chartVersion.engineVersion, snapshotHash: chartVersion.snapshotHash };
  }

  get size(): number {
    return this.records.length;
  }

  /**
   * Append a review. Fail-closed validation; never touches any EvidenceStore.
   * reviewId is content-addressed (identical content => identical id);
   * recordHash chains onto the previous record for tamper evidence.
   */
  add(draft: NewScholarReview): ScholarReviewRecord {
    validateDraft(draft);
    const reviewedAtUtc = draft.reviewedAtUtc ?? new Date().toISOString();
    const reviewId = sha256(
      [
        draft.targetNodeId,
        draft.targetValueDigest,
        draft.targetSubject,
        draft.ruleId ?? '',
        draft.ruleVersion ?? '',
        this.chartVersion.engineVersion,
        this.chartVersion.snapshotHash,
        draft.reviewerId,
        draft.reviewerCredential ?? '',
        draft.verdict,
        draft.commentary,
        draft.source ? `${draft.source.citation}|${draft.source.status}` : '',
        reviewedAtUtc
      ].join('¦'),
      16
    );
    const record: ScholarReviewRecord = {
      reviewId,
      targetNodeId: draft.targetNodeId,
      targetValueDigest: draft.targetValueDigest,
      targetSubject: draft.targetSubject,
      ...(draft.ruleId !== undefined ? { ruleId: draft.ruleId } : {}),
      ...(draft.ruleVersion !== undefined ? { ruleVersion: draft.ruleVersion } : {}),
      chartVersion: { ...this.chartVersion },
      reviewerId: draft.reviewerId,
      ...(draft.reviewerCredential !== undefined ? { reviewerCredential: draft.reviewerCredential } : {}),
      verdict: draft.verdict,
      commentary: draft.commentary,
      ...(draft.source !== undefined ? { source: { ...draft.source } } : {}),
      reviewedAtUtc,
      prevHash: this.lastHash,
      recordHash: ''
    };
    record.recordHash = sha256(
      `scholar-review|${record.prevHash}|${record.reviewId}|${record.targetValueDigest}|${record.reviewerId}|${record.verdict}|${record.commentary}|${record.reviewedAtUtc}`,
      24
    );
    Object.freeze(record);
    this.records.push(record);
    this.lastHash = record.recordHash;
    return record;
  }

  all(): ScholarReviewRecord[] {
    return [...this.records];
  }

  reviewsFor(nodeId: string): ScholarReviewRecord[] {
    return this.records.filter((r) => r.targetNodeId === nodeId);
  }

  latestFor(nodeId: string): ScholarReviewRecord | undefined {
    const rows = this.reviewsFor(nodeId);
    return rows.length ? rows[rows.length - 1] : undefined;
  }

  hasReviewFor(nodeId: string): boolean {
    return this.records.some((r) => r.targetNodeId === nodeId);
  }

  byVerdict(verdict: ScholarVerdict): ScholarReviewRecord[] {
    return this.records.filter((r) => r.verdict === verdict);
  }

  /** Re-derive the chain: any edit to any stored record breaks verification. */
  verifyChain(): { ok: boolean; brokenAt: number | null } {
    let prev = 'SCHOLAR-GENESIS';
    for (let i = 0; i < this.records.length; i++) {
      const r = this.records[i];
      const expected = sha256(
        `scholar-review|${prev}|${r.reviewId}|${r.targetValueDigest}|${r.reviewerId}|${r.verdict}|${r.commentary}|${r.reviewedAtUtc}`,
        24
      );
      if (r.prevHash !== prev || r.recordHash !== expected) return { ok: false, brokenAt: i };
      prev = r.recordHash;
    }
    return { ok: true, brokenAt: null };
  }
}

/** Convenience: build a validated draft from a live node and append it. */
export function attachReview(
  store: ScholarReviewStore,
  node: EvidenceNode,
  draft: Omit<NewScholarReview, 'targetNodeId' | 'targetValueDigest' | 'targetSubject'>
): ScholarReviewRecord {
  return store.add({
    ...draft,
    targetNodeId: node.id,
    targetValueDigest: valueDigestOf(node),
    targetSubject: node.subject,
    ...(node.ruleRef ? { ruleId: node.ruleRef.ruleId, ruleVersion: node.ruleRef.ruleVersion } : {})
  });
}

export type FreshnessState = 'CURRENT' | 'VALUE_CHANGED' | 'NODE_MISSING' | 'RULE_VERSION_DRIFT';

/**
 * A review is never auto-applied. Consumers MUST assess freshness: a review
 * made against a value digest that no longer matches the current node is
 * VALUE_CHANGED — the engine moved; the opinion stays stored but applies to
 * the OLD result only.
 */
export function assessFreshness(record: ScholarReviewRecord, store: EvidenceStore): FreshnessState {
  const node = store.getNode(record.targetNodeId);
  if (!node) return 'NODE_MISSING';
  if (valueDigestOf(node) !== record.targetValueDigest) return 'VALUE_CHANGED';
  if (record.ruleId !== undefined) {
    const live = getClassicalRule(record.ruleId);
    if (live && record.ruleVersion !== undefined && live.version !== record.ruleVersion) return 'RULE_VERSION_DRIFT';
  }
  return 'CURRENT';
}

/* ------------------------------------------------------------------ */
/* The scholar queue — which conclusions NEED a human review           */
/* ------------------------------------------------------------------ */

export type ScholarQueueReason =
  | 'YOGA_STRENGTH_SCHOLAR_JUDGEMENT_REQUIRED'
  | 'COMBUSTION_BORDERLINE'
  | 'COMBUSTION_SCHOLAR_JUDGEMENT_REQUIRED'
  | 'KALSARPA_INDETERMINATE';

export interface ScholarQueueEntry {
  nodeId: string;
  subject: string;
  claim: string;
  reason: ScholarQueueReason;
  /** How many reviews already exist for this node (visibility only — never auto-resolved). */
  existingReviews: number;
}

/**
 * Derive the pending review queue from a compiled evidence graph: exactly the
 * conclusions the charter queues into the scholar flow — yoga PRESENT verdicts
 * (existence engine only, strength is SCHOLAR_JUDGEMENT_REQUIRED, §15),
 * combustion borderline/scholar cases, and INDETERMINATE Kalsarpa charts.
 */
export function scholarQueueFor(ev: CompiledEvidence, reviews?: ScholarReviewStore): ScholarQueueEntry[] {
  const entries: ScholarQueueEntry[] = [];
  for (const node of ev.store.list()) {
    let reason: ScholarQueueReason | null = null;
    if (node.domain === 'CONVENTION' && node.subject.startsWith('convention:yoga:')) {
      const v = node.value as { strength?: { status?: string } };
      if (v.strength?.status === 'SCHOLAR_JUDGEMENT_REQUIRED') reason = 'YOGA_STRENGTH_SCHOLAR_JUDGEMENT_REQUIRED';
    } else if (node.domain === 'CONVENTION' && node.subject.startsWith('convention:combustion:')) {
      const v = node.value as { borderline?: boolean; scholarJudgementRequired?: boolean };
      if (v.scholarJudgementRequired) reason = 'COMBUSTION_SCHOLAR_JUDGEMENT_REQUIRED';
      else if (v.borderline) reason = 'COMBUSTION_BORDERLINE';
    } else if (node.domain === 'CONVENTION' && node.subject === 'convention:kalsarpa') {
      const v = node.value as { status?: string };
      if (v.status === 'INDETERMINATE') reason = 'KALSARPA_INDETERMINATE';
    }
    if (reason) {
      entries.push({
        nodeId: node.id,
        subject: node.subject,
        claim: node.claim,
        reason,
        existingReviews: reviews ? reviews.reviewsFor(node.id).length : 0
      });
    }
  }
  return entries;
}
