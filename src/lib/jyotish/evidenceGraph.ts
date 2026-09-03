/**
 * PJOS-01-DOMAIN: Jyotish Evidence Graph
 * --------------------------------------
 * Immutable evidence nodes with deterministic IDs, transitive dependency
 * tracing, support/conflict resolution, and an append-only hash-chained
 * PredictionRecord ledger.
 *
 * Design invariants (CT-PJOS-01):
 *  - INV-PJOS-001 (single truth): every node is derived from a
 *    CanonicalJyotishSnapshot; no node may carry UI-generated values.
 *  - Deterministic identity: a node ID is the SHA-256 of its content and
 *    provenance. Same computation => same ID, always. No UUIDs for content.
 *  - Immutability: nodes and records are frozen. The store refuses to
 *    associate an existing ID with different content (content-addressing).
 *  - No fake confidence: `confidence` must always be paired with an explicit
 *    `basis` (how it was derived). There are no unexplained percentages.
 *  - No fear framing: status vocabulary is factual (EVIDENCE_BACKED /
 *    INSUFFICIENT_CALCULATION_EVIDENCE / CONVENTION_RULE). Dosha-like facts
 *    are stored as convention-rule evidence, never as verdicts.
 *  - Ledger: PredictionRecords form a hash chain (each record embeds the
 *    previous hash) — append-only and tamper-evident. Reads still require
 *    the D-1 ownership resolution (personRef -> personId -> access grant)
 *    which is enforced at the persistence boundary, not here.
 */

import { createHash } from 'node:crypto';

/* ------------------------------------------------------------------ */
/* Domains                                                             */
/* ------------------------------------------------------------------ */

export const EVIDENCE_DOMAINS = [
  'GRAHA',             // planetary placement, dignity, nakshatra
  'BHAVA',             // house lordship, occupancy, aspects
  'DASHA',             // vimshottari current + window structure
  'PANCHANG',          // tithi/yoga/karana at birth — BOTH temporal semantics
  'VARGA',             // divisional charts (D9…D60)
  'ASHTAKAVARGA',      // BA/SA scores
  'JAIMINI',           // karakas, chatusterika
  'KP',                // Prashna-Kundli sub-lords
  'BALA',              // shadbala / bhava-bala / vimshottari bala
  'RELATIONSHIP',      // panchadha maitri / compatibility structure
  'TIMELINE_OUTCOME',  // time-windows and past-outcome correlation
  'CONVENTION',        // rule-based conventions (yogas, dosha rules, avakhada)
] as const;

export type EvidenceDomain = (typeof EVIDENCE_DOMAINS)[number];

/** How a node's confidence/strength was obtained. Never implicit. */
export type EvidenceBasis =
  | 'DERIVED_FROM_CALCULATION' // computed from the celestial engine snapshot
  | 'CONVENTION_RULE'          // traditional rule applied to computed facts
  | 'DIRECT_OBSERVATION';      // recorded human observation (D-1 consent-gated)

export const PREDICTION_STATUS = {
  EVIDENCE_BACKED: 'EVIDENCE_BACKED',
  INSUFFICIENT_CALCULATION_EVIDENCE: 'INSUFFICIENT_CALCULATION_EVIDENCE',
} as const;
export type PredictionStatus = (typeof PREDICTION_STATUS)[keyof typeof PREDICTION_STATUS];

/* ------------------------------------------------------------------ */
/* Hashing (deterministic identity)                                    */
/* ------------------------------------------------------------------ */

function hashHex(input: string, length = 16): string {
  return createHash('sha256').update(input, 'utf8').digest('hex').slice(0, length);
}

export function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalStringify(obj[k])}`).join(',')}}`;
}

export function snapshotHash(snapshot: unknown): string {
  // Content hash of the canonical snapshot EXCLUDING run-metadata timestamps
  // (meta.calculatedAt): identity must depend only on birth inputs + engine,
  // so the same birth computed twice yields the same hash.
  const { meta, ...rest } = snapshot as { meta?: Record<string, unknown> } & Record<string, unknown>;
  const stableMeta = meta ? Object.fromEntries(Object.entries(meta).filter(([k]) => k !== 'calculatedAt')) : meta;
  return hashHex(`snapshot|${canonicalStringify({ meta: stableMeta, ...rest })}`, 32);
}

/* ------------------------------------------------------------------ */
/* Evidence nodes                                                      */
/* ------------------------------------------------------------------ */

export interface EvidenceNode {
  /** Content-addressed ID: 16 hex chars of SHA-256(domain|subject|claim|value|engineVersion|snapshotHash). */
  id: string;
  domain: EvidenceDomain;
  /** Scoped subject, e.g. `graha:Moon`, `bhava:5`, `dasha:current:MAHA`, `panchang:udayaTithi`. */
  subject: string;
  /** What is being asserted about the subject, e.g. `placement`, `current-mahadasha`, `dignity`. */
  claim: string;
  /** Compact, deterministic, JSON-serializable value. */
  value: unknown;
  /** 0..1 deterministic rule output (e.g. dignity scale). Documented per domain. */
  strength: number;
  /** 0..1 — ALWAYS paired with `basis`; an unexplained number is a bug. */
  confidence: number;
  basis: EvidenceBasis;
  /** Which computation produced this fact (NATAL / TRANSIT / DIRECT_OBSERVATION / ...). */
  sourceTag: string;
  provenance: {
    engineVersion: string;
    snapshotHash: string;
  };
  /** IDs of nodes this node was derived from (across or within domains). */
  dependencies: string[];
  /**
   * Sprint J (§18): which registered classical rule produced this node, when
   * one did. Deliberately OUTSIDE the content hash: node identity is WHAT was
   * computed; the rule reference is provenance that must stay stable across
   * registry version bumps (the registry carries its own version + fingerprint).
   */
  ruleRef?: { ruleId: string; ruleVersion: string };
  createdAt: string;
}

export interface NewEvidenceNode {
  domain: EvidenceDomain;
  subject: string;
  claim: string;
  value: unknown;
  strength?: number;
  confidence: number;
  basis: EvidenceBasis;
  dependencies?: string[];
  /** Provenance tag distinguishing independent computations of the same fact
   *  (e.g. 'NATAL' vs 'TRANSIT' vs 'DIRECT_OBSERVATION' vs 'LEGACY_ENGINE').
   *  Part of the node identity: identical facts from different sources are
   *  DISTINCT nodes that can SUPPORT each other. Default 'CANONICAL'. */
  sourceTag?: string;
  /** Sprint J (§18): registry rule of record (provenance, not identity — see EvidenceNode.ruleRef). */
  ruleRef?: { ruleId: string; ruleVersion: string };
}

export class EvidenceStore {
  private nodes: Map<string, EvidenceNode> = new Map();
  public readonly engineVersion: string;
  public readonly snapshotHash: string;

  constructor(engineVersion: string, snapshotHash: string) {
    this.engineVersion = engineVersion;
    this.snapshotHash = snapshotHash;
  }

  get size(): number {
    return this.nodes.size;
  }

  getNode(id: string): EvidenceNode | undefined {
    return this.nodes.get(id);
  }

  getBySubject(subject: string): EvidenceNode[] {
    return [...this.nodes.values()].filter((n) => n.subject === subject);
  }

  list(): EvidenceNode[] {
    return [...this.nodes.values()];
  }

  /**
   * Compute the deterministic ID for the payload and store it.
   * Content-addressing: identical payload => identical ID (idempotent add);
   * an existing ID with different content is impossible by construction
   * (the ID covers the content) — any mismatch is a caller bug and throws.
   */
  addNode(payload: NewEvidenceNode, createdAt: string = new Date().toISOString()): EvidenceNode {
    const valueKey = canonicalStringify(payload.value);
    const sourceTag = payload.sourceTag ?? 'CANONICAL';
    const id = hashHex(
      [
        payload.domain,
        payload.subject,
        payload.claim,
        valueKey,
        sourceTag,
        this.engineVersion,
        this.snapshotHash,
      ].join('|')
    );
    const existing = this.nodes.get(id);
    if (existing) {
      // Idempotent re-add of the same content: return the original.
      return existing;
    }
    const node: EvidenceNode = Object.freeze({
      id,
      domain: payload.domain,
      subject: payload.subject,
      claim: payload.claim,
      value: Object.freeze(payload.value as object) ?? payload.value,
      strength: payload.strength ?? 0.5,
      confidence: payload.confidence,
      basis: payload.basis,
      sourceTag,
      provenance: {
        engineVersion: this.engineVersion,
        snapshotHash: this.snapshotHash,
      },
      dependencies: [...(payload.dependencies ?? [])],
      ...(payload.ruleRef ? { ruleRef: { ...payload.ruleRef } } : {}),
      createdAt,
    });
    this.nodes.set(id, node);
    return node;
  }

  /**
   * Transitive dependency closure with cycle protection and depth bound.
   * Returns nodes in trace order plus the depth of each, and any cycle
   * detected (cycle nodes are still returned; the trace terminates).
   *
   * Sprint J fix: cycle detection tracks the CURRENT DFS PATH, not global
   * visitation — a diamond (a shared dependency reached via two paths, which
   * the convention graph legitimately contains, e.g. two rule nodes resting on
   * one placement fact) is NOT a cycle. The previous global-visited check
   * false-positived on every diamond.
   */
  traceDependencies(
    rootId: string,
    maxDepth = 64
  ): { nodes: EvidenceNode[]; depth: Map<string, number>; cycles: string[] } {
    const root = this.nodes.get(rootId);
    if (!root) return { nodes: [], depth: new Map(), cycles: [] };
    const depth = new Map<string, number>();
    const nodes: EvidenceNode[] = [];
    const cycles: string[] = [];
    const visited = new Set<string>(); // fully explored subtrees (diamond-safe)
    const onPath = new Set<string>(); // the current DFS path

    const dfs = (id: string, d: number): void => {
      if (d > maxDepth) return;
      const node = this.nodes.get(id);
      if (!node) return;
      depth.set(id, Math.min(d, depth.get(id) ?? d));
      if (onPath.has(id)) {
        if (!cycles.includes(id)) cycles.push(id);
        return; // true cycle: node re-encountered within the current path
      }
      if (visited.has(id)) return; // already fully explored — diamond, not a cycle
      onPath.add(id);
      nodes.push(node);
      for (const dep of node.dependencies) {
        if (!this.nodes.has(dep)) continue; // dangling ref: recorded, not fatal
        dfs(dep, d + 1);
      }
      onPath.delete(id);
      visited.add(id);
    };
    dfs(rootId, 0);
    return { nodes, depth, cycles };
  }

  /**
   * Support/conflict assessment for one node against all other nodes that
   * share its (subject, claim):
   *   - same value  => SUPPORTS (independent derivations agreeing)
   *   - diff value  => CONTRADICTS (same assertion, different result)
   * Nodes with a different claim on the same subject are "related", not
   * support/conflict — they are reported separately.
   */
  assessRelations(nodeId: string): {
    supporting: EvidenceNode[];
    conflicting: EvidenceNode[];
    related: EvidenceNode[];
  } {
    const node = this.nodes.get(nodeId);
    if (!node) return { supporting: [], conflicting: [], related: [] };
    const supporting: EvidenceNode[] = [];
    const conflicting: EvidenceNode[] = [];
    const related: EvidenceNode[] = [];
    const myValue = canonicalStringify(node.value);
    for (const other of this.nodes.values()) {
      if (other.id === node.id) continue;
      if (other.subject !== node.subject) continue;
      if (other.claim !== node.claim) {
        related.push(other);
      } else if (canonicalStringify(other.value) === myValue) {
        supporting.push(other);
      } else {
        conflicting.push(other);
      }
    }
    return { supporting, conflicting, related };
  }
}

/* ------------------------------------------------------------------ */
/* Prediction ledger (immutable, hash-chained)                         */
/* ------------------------------------------------------------------ */

export interface PredictionRecord {
  id: string;
  /** Opaque reference. D-1: resolved to personId + access grant at the
   *  persistence boundary BEFORE any read or mutation. */
  personRef: string;
  /** Factual statement in plain language (no fear framing). */
  statement: string;
  /** Evidence nodes the statement cites. */
  evidenceNodeIds: string[];
  status: PredictionStatus;
  confidence: number;
  basis: EvidenceBasis;
  prevHash: string;
  /** SHA-256 over (prevHash | id | personRef | statement | nodeIds | status). */
  hash: string;
  createdAt: string;
}

export interface NewPrediction {
  personRef: string;
  statement: string;
  evidenceNodeIds: string[];
  confidence: number;
  basis: EvidenceBasis;
}

export class PredictionLedger {
  private records: PredictionRecord[] = [];
  private lastHash: string = 'GENESIS';

  get length(): number {
    return this.records.length;
  }

  all(): PredictionRecord[] {
    return [...this.records];
  }

  /**
   * Append-only. Status is DERIVED, never declared:
   *  EVIDENCE_BACKED   <=> every cited node resolves AND no two cited nodes
   *                       contradict each other (same subject+claim, diff value)
   *  INSUFFICIENT      <=> dangling citation or unresolved conflict.
   * This is the anti-fake-Kashi guarantee: the ledger cannot claim
   * evidence-backed status without resolvable, non-conflicting nodes.
   */
  append(store: EvidenceStore, payload: NewPrediction, createdAt: string = new Date().toISOString()): PredictionRecord {
    const id = hashHex(`prediction|${this.lastHash}|${payload.personRef}|${payload.statement}|${canonicalStringify(payload.evidenceNodeIds)}|${createdAt}`, 24);
    const cited = payload.evidenceNodeIds.map((n) => store.getNode(n)).filter(Boolean) as EvidenceNode[];
    const allResolved = cited.length === payload.evidenceNodeIds.length;

    let conflictFree = true;
    if (allResolved) {
      const groups = new Map<string, EvidenceNode[]>();
      for (const n of cited) {
        const key = `${n.subject}|${n.claim}`;
        groups.set(key, [...(groups.get(key) ?? []), n]);
      }
      for (const group of groups.values()) {
        const values = new Set(group.map((n) => canonicalStringify(n.value)));
        if (values.size > 1) {
          conflictFree = false;
          break;
        }
      }
    }

    const status: PredictionStatus =
      allResolved && conflictFree ? PREDICTION_STATUS.EVIDENCE_BACKED : PREDICTION_STATUS.INSUFFICIENT_CALCULATION_EVIDENCE;

    const hash = hashHex(
      [this.lastHash, id, payload.personRef, payload.statement, canonicalStringify(payload.evidenceNodeIds), status].join('|')
    );
    const record: PredictionRecord = Object.freeze({
      id,
      personRef: payload.personRef,
      statement: payload.statement,
      evidenceNodeIds: [...payload.evidenceNodeIds],
      status,
      confidence: payload.confidence,
      basis: payload.basis,
      prevHash: this.lastHash,
      hash,
      createdAt,
    });
    this.lastHash = hash;
    this.records.push(record);
    return record;
  }

  /** Recompute the whole chain. False if any record was tampered with. */
  verifyChain(): boolean {
    let prev = 'GENESIS';
    for (const r of this.records) {
      if (r.prevHash !== prev) return false;
      const expected = hashHex([r.prevHash, r.id, r.personRef, r.statement, canonicalStringify(r.evidenceNodeIds), r.status].join('|'));
      if (expected !== r.hash) return false;
      prev = r.hash;
    }
    return true;
  }
}
