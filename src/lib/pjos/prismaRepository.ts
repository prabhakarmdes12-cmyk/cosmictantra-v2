/**
 * PJOS-01 DOMAIN: Prisma-backed implementations of the ownership/persistence
 * contracts.
 *
 * BRIDGE NOTE: the checked-in generated Prisma client predates the PJOS-01
 * models, so this module declares a minimal STRUCTURAL interface (PjosDb)
 * for exactly the accessors it uses and casts the client against it. After
 * `prisma generate` runs in the deployment environment, the real client
 * satisfies this interface — no code change needed. Until the PJOS tables
 * exist in the live database, routes that reach them return 503 with a
 * clear "domain tables pending migration" marker (see pjosTablesAvailable).
 */

import type {
  PjosAuthChannel,
  PjosConsentStatus,
  PjosGrantScope,
  PjosRelationshipType,
  PjosSensitivity,
} from '../jyotish/pjosTypes';
import type {
  OwnershipRepository,
  PjosConsentRow,
  PjosGrantRow,
  PjosPersonRow,
  PjosRelationshipRow,
} from './ownershipGuard';

/* ------------------------------------------------------------------ */
/* Structural DB contract (satisfied by the real client post-generate) */
/* ------------------------------------------------------------------ */

export interface PjosPersonRecord extends PjosPersonRow {
  id: string;
  projectId: string;
  displayName: string;
  isMinor: boolean;
  birthDate: Date | null;
  birthTime: string | null;
  birthPlace: string | null;
  birthLat: number | null;
  birthLon: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PjosRelationshipRecord extends PjosRelationshipRow {
  id: string;
  accountId: string;
  guardianRole: string | null;
}

export interface PjosGrantRecord extends PjosGrantRow {
  id: string;
  grantedById: string | null;
}

export interface PjosConsentRecordRow extends PjosConsentRow {
  id: string;
  accountId: string | null;
  purpose: string;
  version: string;
}

export interface PjosAccountRecord {
  id: string;
  authChannel: PjosAuthChannel;
  authSubject: string;
  displayName: string | null;
  isActive: boolean;
}

export interface PjosKundliRecordRow {
  id: string;
  personId: string;
  snapshotHash: string;
  engineVersion: string;
  birthDate: Date;
  birthTime: string;
  birthPlace: string | null;
  birthLat: number | null;
  birthLon: number | null;
  timezone: number | null;
  timeConfidence: string;
  snapshotJson: string;
  createdAt: Date;
}

export interface PjosPredictionRecordRow {
  id: string;
  contentId: string;
  personId: string;
  kundliId: string;
  statement: string;
  evidenceNodeIds: string;
  status: string;
  confidence: number;
  basis: string;
  prevHash: string;
  hash: string;
  createdAt: Date;
}

export interface PjosDb {
  pjosPerson: {
    findUnique(args: { where: { id: string } }): Promise<PjosPersonRecord | null>;
    create(args: { data: Record<string, unknown> }): Promise<PjosPersonRecord>;
    findMany(args: { where: Record<string, unknown>; select?: Record<string, boolean> }): Promise<PjosPersonRecord[]>;
  };
  pjosAccount: {
    findUnique(args: { where: { authChannel_authSubject: { authChannel: PjosAuthChannel; authSubject: string } } }): Promise<PjosAccountRecord | null>;
    upsert(args: { where: { authChannel_authSubject: { authChannel: PjosAuthChannel; authSubject: string } }; create: Record<string, unknown>; update: Record<string, unknown> }): Promise<PjosAccountRecord>;
  };
  pjosPersonRelationship: {
    findUnique(args: { where: { accountId_personId: { accountId: string; personId: string } } }): Promise<PjosRelationshipRecord | null>;
    findMany(args: { where: { accountId: string; isActive?: boolean } }): Promise<PjosRelationshipRecord[]>;
    create(args: { data: Record<string, unknown> }): Promise<PjosRelationshipRecord>;
  };
  pjosAccessGrant: {
    findMany(args: { where: { personId: string } }): Promise<PjosGrantRecord[]>;
  };
  pjosConsentRecord: {
    findMany(args: { where: { personId: string; sensitivity: PjosSensitivity }; orderBy: { grantedAt: 'asc' | 'desc' } }): Promise<PjosConsentRecordRow[]>;
    create(args: { data: Record<string, unknown> }): Promise<PjosConsentRecordRow>;
  };
  pjosKundliRecord: {
    findUnique(args: { where: { id: string } }): Promise<PjosKundliRecordRow | null>;
    findMany(args: { where: { personId: string }; orderBy: { createdAt: 'asc' | 'desc' } }): Promise<PjosKundliRecordRow[]>;
    findFirst(args: { where: { personId: string; snapshotHash: string } }): Promise<PjosKundliRecordRow | null>;
    create(args: { data: Record<string, unknown> }): Promise<PjosKundliRecordRow>;
  };
  pjosPredictionRecord: {
    findMany(args: { where: { kundliId: string; personId: string }; orderBy: { createdAt: 'asc' } }): Promise<PjosPredictionRecordRow[]>;
    create(args: { data: Record<string, unknown> }): Promise<PjosPredictionRecordRow>;
  };
}

/**
 * The real Prisma client, cast to the structural contract above.
 *
 * LAZY: `db` is required on first call (not at module load) so that unit
 * tests — which inject an in-memory PjosDb and never touch the database —
 * can import this module without instantiating the Prisma engine. In the
 * Next.js runtime the first call happens at request time, where the engine
 * is available.
 */
/**
 * Probe whether the PJOS tables exist in the live database. A missing table
 * throws a P2021-family Prisma error; we translate that into a boolean so
 * routes can fail with a clear 503 instead of an opaque 500.
 *
 * NOTE: `client` is a required parameter. This module deliberately does NOT
 * import the Prisma client (see pjosDbProvider.ts), so it stays import-safe
 * in unit tests that inject an in-memory PjosDb.
 */
export async function pjosTablesAvailable(client: PjosDb): Promise<boolean> {
  try {
    await client.pjosPerson.findMany({ where: { id: '__pjos_probe__' } });
    return true;
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code && /^P20(?:21|22)/.test(code)) return false;
    throw e;
  }
}

/* ------------------------------------------------------------------ */
/* OwnershipRepository over Prisma                                     */
/* ------------------------------------------------------------------ */

export class PrismaOwnershipRepository implements OwnershipRepository {
  constructor(private readonly client: PjosDb) {}

  async getPerson(personId: string): Promise<PjosPersonRow | null> {
    const p = await this.client.pjosPerson.findUnique({ where: { id: personId } });
    return p ? { id: p.id, isMinor: p.isMinor } : null;
  }

  async findRelationship(personId: string, accountId: string): Promise<PjosRelationshipRow | null> {
    const r = await this.client.pjosPersonRelationship.findUnique({
      where: { accountId_personId: { accountId, personId } },
    });
    return r
      ? { personId: r.personId, relationType: r.relationType as PjosRelationshipType, guardianRole: r.guardianRole, isActive: r.isActive }
      : null;
  }

  async findGrantsForPerson(personId: string): Promise<PjosGrantRow[]> {
    const grants = await this.client.pjosAccessGrant.findMany({ where: { personId } });
    return grants.map((g) => ({
      personId: g.personId,
      granteeAccountId: g.granteeAccountId,
      granteePractitionerId: g.granteePractitionerId,
      scope: g.scope as PjosGrantScope,
      sensitivity: g.sensitivity as PjosSensitivity,
      grantedAt: g.grantedAt,
      expiresAt: g.expiresAt,
      revokedAt: g.revokedAt,
    }));
  }

  /** Latest event for (personId, sensitivity) wins — revocation supersedes. */
  async countActiveConsents(personId: string, sensitivity: PjosSensitivity): Promise<number> {
    const events = await this.client.pjosConsentRecord.findMany({
      where: { personId, sensitivity },
      orderBy: { grantedAt: 'asc' },
    });
    if (events.length === 0) return 0;
    const latest: PjosConsentRecordRow = events[events.length - 1];
    return latest.status === ('GRANTED' as PjosConsentStatus) && !latest.revokedAt ? 1 : 0;
  }
}

// NOTE: no default repository factory here — the Prisma client lives in
// pjosDbProvider.ts so this module remains import-safe for unit tests.
