/**
 * PJOS-01 DOMAIN: persistent kundli records + prediction ledger.
 *
 * Pipeline (the "same truth" rule):
 *   birth inputs -> CanonicalJyotishSnapshot (one engine)
 *     -> snapshotHash (content-addressed, excludes run timestamps)
 *     -> PjosKundliRecord (idempotent upsert on personId+snapshotHash)
 *     -> compileEvidence(snapshot)          (12 domains)
 *     -> PredictionLedger (derived status, hash chain)
 *     -> PjosPredictionRecord rows (chain continues across requests)
 *
 * Immutability: kundli records and prediction rows are never updated. A
 * corrected birth time is a NEW record with a new hash — the old one stays
 * for the versioned-snapshot history (D-2: changing inputs creates a new
 * deterministic snapshot).
 */

import type { CanonicalJyotishSnapshot } from '../jyotish/canonicalSnapshot';
import {
  derivePredictionStatus,
  predictionRecordHash,
  predictionRecordId,
  snapshotHash as computeSnapshotHash,
  canonicalStringify,
  type EvidenceStore,
  type NewPrediction,
  type PredictionRecord,
} from '../jyotish/evidenceGraph';
import { compileEvidence, type CompiledEvidence } from '../jyotish/evidenceCompiler';
import type { PjosDb, PjosKundliRecordRow, PjosPredictionRecordRow } from './prismaRepository';
import type { PjosTimeConfidence } from '../jyotish/pjosTypes';

export interface PjosBirthInput {
  personId: string;
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:mm
  birthPlace?: string;
  birthLat?: number;
  birthLon?: number;
  timezone?: number;
  timeConfidence?: PjosTimeConfidence;
}

export function pjosSnapshotHash(snapshot: CanonicalJyotishSnapshot): string {
  return computeSnapshotHash(snapshot);
}

/**
 * Persist (idempotently) a canonical snapshot for a person. Returns the
 * stored record. Does NOT accept UI-computed positions — only the snapshot
 * produced by the canonical engine (INV-PJOS-001).
 */
export async function persistKundliRecord(
  client: PjosDb,
  input: PjosBirthInput,
  snapshot: CanonicalJyotishSnapshot
): Promise<PjosKundliRecordRow> {
  const hash = pjosSnapshotHash(snapshot);
  const existing = await client.pjosKundliRecord.findFirst({
    where: { personId: input.personId, snapshotHash: hash },
  });
  if (existing) return existing;

  return client.pjosKundliRecord.create({
    data: {
      personId: input.personId,
      snapshotHash: hash,
      engineVersion: snapshot.meta.engineVersion,
      birthDate: new Date(`${input.birthDate}T00:00:00Z`),
      birthTime: input.birthTime,
      birthPlace: input.birthPlace ?? null,
      birthLat: input.birthLat ?? null,
      birthLon: input.birthLon ?? null,
      timezone: input.timezone ?? null,
      timeConfidence: input.timeConfidence ?? 'EXACT',
      snapshotJson: JSON.stringify(snapshot),
    },
  });
}

export async function listKundliRecords(client: PjosDb, personId: string): Promise<PjosKundliRecordRow[]> {
  return client.pjosKundliRecord.findMany({ where: { personId }, orderBy: { createdAt: 'desc' } });
}

/**
 * Rebuild the 12-domain evidence store from a persisted record. The snapshot
 * is parsed from the stored canonical JSON — evidence is ALWAYS recomputed
 * from the single truth, never stored separately.
 */
export function buildEvidenceForKundli(record: PjosKundliRecordRow): { snapshot: CanonicalJyotishSnapshot; compiled: CompiledEvidence; store: EvidenceStore } {
  const snapshot = JSON.parse(record.snapshotJson) as CanonicalJyotishSnapshot;
  const compiled = compileEvidence(snapshot);
  return { snapshot, compiled, store: compiled.store };
}

/* ------------------------------------------------------------------ */
/* Prediction ledger persistence (hash chain continues across requests) */
/* ------------------------------------------------------------------ */

export interface PersistedPrediction extends PredictionRecord {
  dbId: string;
}

/**
 * Append a prediction to the persisted ledger for a kundli. The chain tip is
 * taken from the last stored row (or GENESIS), the status is DERIVED from the
 * evidence store (never declared), and a tampered/gapped chain refuses new
 * entries until repaired. Rows are never updated — append-only.
 */
export async function appendPredictionToKundli(
  client: PjosDb,
  kundli: PjosKundliRecordRow,
  store: EvidenceStore,
  payload: NewPrediction
): Promise<PersistedPrediction> {
  const rows = await client.pjosPredictionRecord.findMany({
    where: { kundliId: kundli.id, personId: kundli.personId },
    orderBy: { createdAt: 'asc' },
  });

  // Refuse to extend a corrupted chain (tamper-evidence at write time):
  // verify BOTH link continuity and every row's own hash.
  for (let i = 0; i < rows.length; i++) {
    const expectedPrev = i === 0 ? 'GENESIS' : rows[i - 1].hash;
    if (rows[i].prevHash !== expectedPrev) {
      throw new Error('prediction chain corrupted: refusing to extend');
    }
    let nodeIds: string[];
    try {
      nodeIds = JSON.parse(rows[i].evidenceNodeIds);
    } catch {
      throw new Error('prediction chain corrupted: refusing to extend');
    }
    const expectedHash = predictionRecordHash(
      rows[i].prevHash,
      rows[i].contentId,
      rows[i].personId,
      rows[i].statement,
      nodeIds,
      rows[i].status as PredictionRecord['status']
    );
    if (expectedHash !== rows[i].hash) {
      throw new Error('prediction chain corrupted: refusing to extend');
    }
  }

  const prevHash = rows.length > 0 ? rows[rows.length - 1].hash : 'GENESIS';
  const createdAt = new Date().toISOString();
  const status = derivePredictionStatus(store, payload.evidenceNodeIds);
  const id = predictionRecordId(prevHash, payload.personRef, payload.statement, payload.evidenceNodeIds, createdAt);
  const hash = predictionRecordHash(prevHash, id, payload.personRef, payload.statement, payload.evidenceNodeIds, status);

  const row = await client.pjosPredictionRecord.create({
    data: {
      contentId: id,
      personId: kundli.personId,
      kundliId: kundli.id,
      statement: payload.statement,
      evidenceNodeIds: canonicalStringify(payload.evidenceNodeIds),
      status,
      confidence: payload.confidence,
      basis: payload.basis,
      prevHash,
      hash,
    },
  });
  return {
    id,
    personRef: payload.personRef,
    statement: payload.statement,
    evidenceNodeIds: [...payload.evidenceNodeIds],
    status,
    confidence: payload.confidence,
    basis: payload.basis,
    prevHash,
    hash,
    createdAt,
    dbId: row.id,
  };
}

/**
 * Verify the persisted chain: link continuity AND per-row hash integrity.
 * Returns false on any tamper (field edit), gap, or order change.
 */
export async function verifyKundliPredictionChain(
  client: PjosDb,
  kundliId: string,
  personId: string
): Promise<{ verified: boolean; count: number }> {
  const rows = await client.pjosPredictionRecord.findMany({
    where: { kundliId, personId },
    orderBy: { createdAt: 'asc' },
  });
  let prev = 'GENESIS';
  for (const r of rows) {
    if (r.prevHash !== prev) return { verified: false, count: rows.length };
    let nodeIds: string[];
    try {
      nodeIds = JSON.parse(r.evidenceNodeIds);
    } catch {
      return { verified: false, count: rows.length };
    }
    const expected = predictionRecordHash(r.prevHash, r.contentId, r.personId, r.statement, nodeIds, r.status as PredictionRecord['status']);
    if (expected !== r.hash) return { verified: false, count: rows.length };
    prev = r.hash;
  }
  return { verified: true, count: rows.length };
}
