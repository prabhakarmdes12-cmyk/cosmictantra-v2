/**
 * PJOS IDENTITY — rows and the persistence port.
 *
 * Mirrors the Prisma models without importing `@prisma/client`, for the same
 * reason `pjosTypes.ts` does: the engine download is unavailable in some
 * environments, and this logic is worth writing and testing before a client
 * can be generated. Prisma rows satisfy these structurally.
 */
import type {
  PjosAuthChannel, PjosRelationshipType, PjosSensitivity,
} from '../../jyotish/pjosTypes';

export interface AccountRow {
  id: string;
  displayName: string | null;
  isActive: boolean;
  /** Set when this account lost a merge; follow it to the survivor. */
  mergedIntoId: string | null;
  createdAt: Date;
}

export interface AuthIdentityRow {
  id: string;
  accountId: string;
  channel: PjosAuthChannel;
  /** Already normalised — see `normaliseSubject`. */
  subject: string;
  verifiedAt: Date | null;
  createdAt: Date;
}

export interface PersonRow {
  id: string;
  displayName: string;
  birthDate: Date | null;
  birthTime: string | null;
  birthPlace: string | null;
  birthLat: number | null;
  birthLon: number | null;
  isMinor: boolean;
}

export interface RelationshipRow {
  id: string;
  accountId: string;
  personId: string;
  relationType: PjosRelationshipType;
  isActive: boolean;
}

export interface AnonymousSessionRow {
  id: string;
  tokenHash: string;
  personId: string | null;
  claimedByAccountId: string | null;
  claimedAt: Date | null;
  createdAt: Date;
  expiresAt: Date;
}

export interface AccountMergeRow {
  id: string;
  survivingAccountId: string;
  absorbedAccountId: string;
  reason: string;
  personsMoved: number;
  identitiesMoved: number;
  mergedAt: Date;
}

/** The birth details a visitor types before anyone asks who they are. */
export interface BirthDetailsInput {
  displayName: string;
  birthDate?: Date | null;
  birthTime?: string | null;
  birthPlace?: string | null;
  birthLat?: number | null;
  birthLon?: number | null;
  isMinor?: boolean;
}

/**
 * Persistence boundary.
 *
 * Deliberately small and free of query language so the whole identity policy
 * can be exercised against an in-memory implementation. Everything here is
 * allowed to be async; the service always awaits.
 */
export interface IdentityRepository {
  createAccount(input: { displayName: string | null; now: Date }): Promise<AccountRow>;
  getAccount(accountId: string): Promise<AccountRow | null>;
  markAccountMerged(absorbedId: string, survivingId: string): Promise<void>;

  findIdentity(channel: PjosAuthChannel, subject: string): Promise<AuthIdentityRow | null>;
  createIdentity(input: {
    accountId: string; channel: PjosAuthChannel; subject: string;
    verifiedAt: Date | null; now: Date;
  }): Promise<AuthIdentityRow>;
  listIdentities(accountId: string): Promise<AuthIdentityRow[]>;
  reassignIdentities(fromAccountId: string, toAccountId: string): Promise<number>;

  createPerson(input: BirthDetailsInput): Promise<PersonRow>;
  getPerson(personId: string): Promise<PersonRow | null>;
  deletePerson(personId: string): Promise<void>;

  listRelationships(accountId: string): Promise<RelationshipRow[]>;
  findRelationship(accountId: string, personId: string): Promise<RelationshipRow | null>;
  createRelationship(input: {
    accountId: string; personId: string; relationType: PjosRelationshipType;
  }): Promise<RelationshipRow>;
  /** Moves relationships, skipping any personId the target already holds. */
  reassignRelationships(fromAccountId: string, toAccountId: string): Promise<number>;
  reassignGrantOrigin(fromAccountId: string, toAccountId: string): Promise<number>;

  createSession(input: { tokenHash: string; now: Date; expiresAt: Date }): Promise<AnonymousSessionRow>;
  findSessionByTokenHash(tokenHash: string): Promise<AnonymousSessionRow | null>;
  attachPersonToSession(sessionId: string, personId: string): Promise<void>;
  markSessionClaimed(sessionId: string, accountId: string, now: Date): Promise<void>;

  recordConsent(input: {
    personId: string; accountId: string; sensitivity: PjosSensitivity;
    purpose: string; version: string; now: Date;
  }): Promise<void>;

  recordMerge(input: Omit<AccountMergeRow, 'id'>): Promise<AccountMergeRow>;
}
