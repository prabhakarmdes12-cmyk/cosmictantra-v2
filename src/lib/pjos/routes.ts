/**
 * PJOS-01 DOMAIN: core API handlers for the identity/kundli/prediction
 * surface. Pure functions of (client, actor, args) -> { status, body } so
 * they are unit-testable with an in-memory fake client, and so the Next.js
 * route files stay thin wrappers.
 *
 * Every handler enforces the ownership invariant BEFORE reading or writing
 * any person-scoped data (assertOwnership). The actor comes from
 * resolvePjosActor (session or operator) — never from request body fields
 * like "myPersonId".
 */

import { getCanonicalJyotishSnapshot } from '../jyotish/canonicalSnapshot';
import type { CanonicalJyotishSnapshot } from '../jyotish/canonicalSnapshot';
import type { PjosRelationshipType, PjosTimeConfidence } from '../jyotish/pjosTypes';
import {
  assertOwnership,
  OwnershipDeniedError,
  type ActorIdentity,
} from './ownershipGuard';
import type { PjosDb } from './prismaRepository';
import { pjosTablesAvailable, PrismaOwnershipRepository } from './prismaRepository';
import {
  appendPredictionToKundli,
  buildEvidenceForKundli,
  listKundliRecords,
  persistKundliRecord,
  verifyKundliPredictionChain,
} from './kundliPersistence';
import type { PjosActor } from './session';

export interface HandlerResult {
  status: number;
  body: Record<string, unknown>;
}

function actorIdentity(actor: PjosActor): ActorIdentity {
  return {
    accountId: actor.accountId ?? undefined,
    practitionerId: actor.practitionerId ?? undefined,
    isProfessional: actor.isProfessional,
  };
}

const RELATION_TYPES: PjosRelationshipType[] = [
  'SELF',
  'GUARDIAN_MANAGED',
  'WITH_CONSENT',
  'IMPORTED_FOR_PRIVATE_ANALYSIS',
  'PANDIT_CLIENT',
];

/* ------------------------------------------------------------------ */
/* Persons                                                             */
/* ------------------------------------------------------------------ */

/** GET /api/pjos/persons — persons the actor has an ACTIVE relationship with.
 *  Minimal payload: id + display name + relation type. No birth data here. */
export async function handleListPersons(client: PjosDb, actor: PjosActor): Promise<HandlerResult> {
  if (!actor.accountId) return { status: 401, body: { success: false, error: 'Authentication required.' } };
  if (!(await pjosTablesAvailable(client))) return { status: 503, body: { success: false, error: 'PJOS domain tables pending migration.' } };

  const rels = await client.pjosPersonRelationship.findMany({ where: { accountId: actor.accountId, isActive: true } });
  const persons = await Promise.all(
    rels.map(async (r) => {
      const p = await client.pjosPerson.findUnique({ where: { id: r.personId } });
      return p
        ? { id: p.id, displayName: p.displayName, relationType: r.relationType, isMinor: p.isMinor, guardianRole: r.guardianRole }
        : null;
    })
  );
  return { status: 200, body: { success: true, persons: persons.filter(Boolean) } };
}

/** POST /api/pjos/persons — create a person under the account (default SELF). */
export async function handleCreatePerson(client: PjosDb, actor: PjosActor, input: Record<string, unknown>): Promise<HandlerResult> {
  if (!actor.accountId) return { status: 401, body: { success: false, error: 'Authentication required.' } };
  if (!(await pjosTablesAvailable(client))) return { status: 503, body: { success: false, error: 'PJOS domain tables pending migration.' } };

  const displayName = typeof input.displayName === 'string' ? input.displayName.trim() : '';
  if (!displayName) return { status: 400, body: { success: false, error: 'displayName required.' } };
  const relationType = RELATION_TYPES.includes(input.relationType as PjosRelationshipType)
    ? (input.relationType as PjosRelationshipType)
    : 'SELF';
  const isMinor = Boolean(input.isMinor);
  if (relationType === 'GUARDIAN_MANAGED' && !isMinor) {
    return { status: 400, body: { success: false, error: 'GUARDIAN_MANAGED requires isMinor=true.' } };
  }

  const person = await client.pjosPerson.create({
    data: {
      displayName,
      isMinor,
      birthDate: input.birthDate ? new Date(String(input.birthDate)) : null,
      birthTime: typeof input.birthTime === 'string' ? input.birthTime : null,
      birthPlace: typeof input.birthPlace === 'string' ? input.birthPlace : null,
      birthLat: typeof input.birthLat === 'number' ? input.birthLat : null,
      birthLon: typeof input.birthLon === 'number' ? input.birthLon : null,
    },
  });
  await client.pjosPersonRelationship.create({
    data: {
      accountId: actor.accountId,
      personId: person.id,
      relationType,
      guardianRole: typeof input.guardianRole === 'string' ? input.guardianRole : null,
    },
  });
  return { status: 201, body: { success: true, person: { id: person.id, displayName: person.displayName, relationType, isMinor: person.isMinor } } };
}

/* ------------------------------------------------------------------ */
/* Kundli records                                                      */
/* ------------------------------------------------------------------ */

function buildSnapshot(input: Record<string, unknown>): CanonicalJyotishSnapshot | { error: string } {
  const birthDate = typeof input.birthDate === 'string' ? input.birthDate : '';
  const birthTime = typeof input.birthTime === 'string' ? input.birthTime : '';
  const lat = typeof input.latitude === 'number' ? input.latitude : Number(input.latitude);
  const lon = typeof input.longitude === 'number' ? input.longitude : Number(input.longitude);
  const tz = typeof input.timezone === 'number' ? input.timezone : Number(input.timezone);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !/^\d{2}:\d{2}$/.test(birthTime) || !Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(tz)) {
    return { error: 'birthDate (YYYY-MM-DD), birthTime (HH:mm), latitude, longitude, timezone (number) required.' };
  }
  return getCanonicalJyotishSnapshot({
    birthDate,
    birthTime,
    latitude: lat,
    longitude: lon,
    timezone: tz,
    locationName: typeof input.locationName === 'string' ? input.locationName : '',
  });
}

/** POST /api/pjos/kundli — compute + persist a kundli for a person (WRITE). */
export async function handleCreateKundli(client: PjosDb, actor: PjosActor, input: Record<string, unknown>): Promise<HandlerResult> {
  if (!(actor.accountId || actor.practitionerId)) return { status: 401, body: { success: false, error: 'Authentication required.' } };
  if (!(await pjosTablesAvailable(client))) return { status: 503, body: { success: false, error: 'PJOS domain tables pending migration.' } };

  const personId = typeof input.personId === 'string' ? input.personId : '';
  if (!personId) return { status: 400, body: { success: false, error: 'personId required.' } };

  try {
    await assertOwnership(
      ownershipRepo(client),
      actorIdentity(actor),
      { personId, sensitivity: 'PERSONAL_ASTROLOGY', action: 'WRITE' }
    );
  } catch (e) {
    if (e instanceof OwnershipDeniedError) return { status: 403, body: { success: false, error: `Forbidden: ${e.reason}` } };
    throw e;
  }

  const snapshot = buildSnapshot(input);
  if ('error' in snapshot) return { status: 400, body: { success: false, error: snapshot.error } };

  const timeConfidence: PjosTimeConfidence =
    input.timeConfidence === 'APPROXIMATE' || input.timeConfidence === 'UNKNOWN' ? input.timeConfidence : 'EXACT';

  const record = await persistKundliRecord(client, {
    personId,
    birthDate: input.birthDate as string,
    birthTime: input.birthTime as string,
    birthPlace: typeof input.locationName === 'string' ? input.locationName : undefined,
    birthLat: typeof input.latitude === 'number' ? input.latitude : Number(input.latitude),
    birthLon: typeof input.longitude === 'number' ? input.longitude : Number(input.longitude),
    timezone: Number(input.timezone),
    timeConfidence,
  }, snapshot);

  const { compiled } = buildEvidenceForKundli(record);
  return {
    status: 201,
    body: {
      success: true,
      kundli: {
        id: record.id,
        personId,
        snapshotHash: record.snapshotHash,
        engineVersion: record.engineVersion,
        timeConfidence,
        createdAt: record.createdAt.toISOString?.() ?? record.createdAt,
      },
      evidence: { nodeCount: compiled.nodeCount, domainsPresent: compiled.domainsPresent },
    },
  };
}

/** GET /api/pjos/kundli/[id] — read a kundli record (READ). */
export async function handleGetKundli(
  client: PjosDb,
  actor: PjosActor,
  kundliId: string,
  opts: { includeEvidence?: boolean; domains?: string[] }
): Promise<HandlerResult> {
  if (!(actor.accountId || actor.practitionerId)) return { status: 401, body: { success: false, error: 'Authentication required.' } };
  if (!(await pjosTablesAvailable(client))) return { status: 503, body: { success: false, error: 'PJOS domain tables pending migration.' } };

  const record = await findKundliById(client, kundliId);
  if (!record) return { status: 404, body: { success: false, error: 'Kundli not found.' } };

  try {
    await assertOwnership(
      ownershipRepo(client),
      actorIdentity(actor),
      { personId: record.personId, sensitivity: 'PERSONAL_ASTROLOGY', action: 'READ' }
    );
  } catch (e) {
    if (e instanceof OwnershipDeniedError) return { status: 403, body: { success: false, error: `Forbidden: ${e.reason}` } };
    throw e;
  }

  const body: Record<string, unknown> = {
    success: true,
    kundli: {
      id: record.id,
      personId: record.personId,
      snapshotHash: record.snapshotHash,
      engineVersion: record.engineVersion,
      birthDate: record.birthDate.toISOString?.().slice(0, 10) ?? record.birthDate,
      birthTime: record.birthTime,
      birthPlace: record.birthPlace,
      timeConfidence: record.timeConfidence,
    },
    snapshot: JSON.parse(record.snapshotJson),
  };
  if (opts.includeEvidence) {
    const { store, compiled } = buildEvidenceForKundli(record);
    const wanted = opts.domains?.length ? new Set(opts.domains) : null;
    body.evidence = {
      nodeCount: compiled.nodeCount,
      domainsPresent: compiled.domainsPresent,
      nodes: store
        .list()
        .filter((n) => !wanted || wanted.has(n.domain))
        .map((n) => ({
          id: n.id,
          domain: n.domain,
          subject: n.subject,
          claim: n.claim,
          value: n.value,
          strength: n.strength,
          confidence: n.confidence,
          basis: n.basis,
          sourceTag: n.sourceTag,
          dependencies: n.dependencies,
        })),
    };
  }
  return { status: 200, body };
}

/** Resolve a kundli record by id (person-agnostic). The ownership guard
 *  runs AFTER resolution and BEFORE any data is returned — the id alone
 *  grants nothing. */
async function findKundliById(client: PjosDb, kundliId: string) {
  return client.pjosKundliRecord.findUnique({ where: { id: kundliId } });
}

/* ------------------------------------------------------------------ */
/* Predictions                                                         */
/* ------------------------------------------------------------------ */

/** GET /api/pjos/kundli/[id]/predictions — the ledger + chain integrity. */
export async function handleListPredictions(client: PjosDb, actor: PjosActor, kundliId: string): Promise<HandlerResult> {
  if (!(actor.accountId || actor.practitionerId)) return { status: 401, body: { success: false, error: 'Authentication required.' } };
  if (!(await pjosTablesAvailable(client))) return { status: 503, body: { success: false, error: 'PJOS domain tables pending migration.' } };

  const record = await findKundliById(client, kundliId);
  if (!record) return { status: 404, body: { success: false, error: 'Kundli not found.' } };
  try {
    await assertOwnership(
      ownershipRepo(client),
      actorIdentity(actor),
      { personId: record.personId, sensitivity: 'PERSONAL_ASTROLOGY', action: 'READ' }
    );
  } catch (e) {
    if (e instanceof OwnershipDeniedError) return { status: 403, body: { success: false, error: `Forbidden: ${e.reason}` } };
    throw e;
  }

  const preds = await client.pjosPredictionRecord.findMany({ where: { kundliId, personId: record.personId }, orderBy: { createdAt: 'asc' } });
  const chain = await verifyKundliPredictionChain(client, kundliId, record.personId);
  return {
    status: 200,
    body: {
      success: true,
      predictions: preds.map((p) => ({
        contentId: p.contentId,
        statement: p.statement,
        status: p.status,
        confidence: p.confidence,
        basis: p.basis,
        evidenceNodeIds: JSON.parse(p.evidenceNodeIds),
        createdAt: p.createdAt.toISOString?.() ?? p.createdAt,
      })),
      chain: chain,
    },
  };
}

/** POST /api/pjos/kundli/[id]/predictions — append (status is derived). */
export async function handleCreatePrediction(client: PjosDb, actor: PjosActor, kundliId: string, input: Record<string, unknown>): Promise<HandlerResult> {
  if (!(actor.accountId || actor.practitionerId)) return { status: 401, body: { success: false, error: 'Authentication required.' } };
  if (!(await pjosTablesAvailable(client))) return { status: 503, body: { success: false, error: 'PJOS domain tables pending migration.' } };

  const statement = typeof input.statement === 'string' ? input.statement.trim() : '';
  const evidenceNodeIds = Array.isArray(input.evidenceNodeIds) ? (input.evidenceNodeIds as string[]).filter((x) => typeof x === 'string') : [];
  const confidence = typeof input.confidence === 'number' ? input.confidence : NaN;
  const basis = input.basis === 'CONVENTION_RULE' || input.basis === 'DIRECT_OBSERVATION' ? input.basis : 'DERIVED_FROM_CALCULATION';
  if (!statement || evidenceNodeIds.length === 0 || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    return { status: 400, body: { success: false, error: 'statement, evidenceNodeIds[] and confidence (0..1) required.' } };
  }

  const record = await findKundliById(client, kundliId);
  if (!record) return { status: 404, body: { success: false, error: 'Kundli not found.' } };
  try {
    await assertOwnership(
      ownershipRepo(client),
      actorIdentity(actor),
      { personId: record.personId, sensitivity: 'PERSONAL_ASTROLOGY', action: 'WRITE' }
    );
  } catch (e) {
    if (e instanceof OwnershipDeniedError) return { status: 403, body: { success: false, error: `Forbidden: ${e.reason}` } };
    throw e;
  }

  const { store } = buildEvidenceForKundli(record);
  try {
    const persisted = await appendPredictionToKundli(client, record, store, {
      personRef: record.personId,
      statement,
      evidenceNodeIds,
      confidence,
      basis,
    });
    const chain = await verifyKundliPredictionChain(client, kundliId, record.personId);
    return { status: 201, body: { success: true, prediction: { ...persisted, dbId: undefined }, chain } };
  } catch (e) {
    return { status: 409, body: { success: false, error: (e as Error).message } };
  }
}

/* ------------------------------------------------------------------ */

function ownershipRepo(client: PjosDb) {
  return new PrismaOwnershipRepository(client);
}
