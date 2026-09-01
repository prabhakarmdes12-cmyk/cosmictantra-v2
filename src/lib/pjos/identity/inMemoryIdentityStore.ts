/**
 * In-memory `IdentityRepository`.
 *
 * Two jobs. It is the test double for the identity suite, and it is the
 * reference semantics for the Prisma adapter: where the two disagree, this
 * file is what the tests describe, so the adapter is wrong. Kept deliberately
 * literal — no cleverness that a SQL implementation could not reproduce.
 */
import type { PjosAuthChannel, PjosSensitivity } from '../../jyotish/pjosTypes';
import type {
  AccountMergeRow, AccountRow, AnonymousSessionRow, AuthIdentityRow,
  BirthDetailsInput, IdentityRepository, PersonRow, RelationshipRow,
} from './types';

export interface ConsentRecorded {
  personId: string;
  accountId: string;
  sensitivity: PjosSensitivity;
  purpose: string;
  version: string;
  grantedAt: Date;
}

export class InMemoryIdentityStore implements IdentityRepository {
  readonly accounts = new Map<string, AccountRow>();
  readonly identities = new Map<string, AuthIdentityRow>();
  readonly persons = new Map<string, PersonRow>();
  readonly relationships = new Map<string, RelationshipRow>();
  readonly sessions = new Map<string, AnonymousSessionRow>();
  readonly merges: AccountMergeRow[] = [];
  readonly consents: ConsentRecorded[] = [];

  private seq = 0;

  private id(prefix: string): string {
    this.seq += 1;
    return `${prefix}-${String(this.seq).padStart(4, '0')}`;
  }

  /* ---- accounts ---- */

  async createAccount(input: { displayName: string | null; now: Date }): Promise<AccountRow> {
    const row: AccountRow = {
      id: this.id('acct'),
      displayName: input.displayName,
      isActive: true,
      mergedIntoId: null,
      createdAt: input.now,
    };
    this.accounts.set(row.id, row);
    return row;
  }

  async getAccount(accountId: string): Promise<AccountRow | null> {
    return this.accounts.get(accountId) ?? null;
  }

  async markAccountMerged(absorbedId: string, survivingId: string): Promise<void> {
    const row = this.accounts.get(absorbedId);
    if (!row) return;
    // The absorbed account is retained, not deleted: consent rows and audit
    // rows still point at it.
    row.mergedIntoId = survivingId;
    row.isActive = false;
  }

  /* ---- credentials ---- */

  private identityKey(channel: PjosAuthChannel, subject: string): string {
    return `${channel}::${subject}`;
  }

  async findIdentity(channel: PjosAuthChannel, subject: string): Promise<AuthIdentityRow | null> {
    return this.identities.get(this.identityKey(channel, subject)) ?? null;
  }

  async createIdentity(input: {
    accountId: string; channel: PjosAuthChannel; subject: string;
    verifiedAt: Date | null; now: Date;
  }): Promise<AuthIdentityRow> {
    const key = this.identityKey(input.channel, input.subject);
    if (this.identities.has(key)) {
      // Mirrors the (channel, subject) unique index. The service is expected
      // to look before it writes; if it did not, this is where it finds out.
      throw new Error(`UNIQUE constraint failed: PjosAuthIdentity(${key})`);
    }
    const row: AuthIdentityRow = {
      id: this.id('idn'),
      accountId: input.accountId,
      channel: input.channel,
      subject: input.subject,
      verifiedAt: input.verifiedAt,
      createdAt: input.now,
    };
    this.identities.set(key, row);
    return row;
  }

  async listIdentities(accountId: string): Promise<AuthIdentityRow[]> {
    return [...this.identities.values()].filter((i) => i.accountId === accountId);
  }

  async reassignIdentities(fromAccountId: string, toAccountId: string): Promise<number> {
    let n = 0;
    for (const row of this.identities.values()) {
      if (row.accountId === fromAccountId) { row.accountId = toAccountId; n += 1; }
    }
    return n;
  }

  /* ---- persons ---- */

  async createPerson(input: BirthDetailsInput): Promise<PersonRow> {
    const row: PersonRow = {
      id: this.id('per'),
      displayName: input.displayName,
      birthDate: input.birthDate ?? null,
      birthTime: input.birthTime ?? null,
      birthPlace: input.birthPlace ?? null,
      birthLat: input.birthLat ?? null,
      birthLon: input.birthLon ?? null,
      isMinor: input.isMinor ?? false,
    };
    this.persons.set(row.id, row);
    return row;
  }

  async getPerson(personId: string): Promise<PersonRow | null> {
    return this.persons.get(personId) ?? null;
  }

  async deletePerson(personId: string): Promise<void> {
    this.persons.delete(personId);
    for (const [key, rel] of this.relationships) {
      if (rel.personId === personId) this.relationships.delete(key);
    }
    for (const session of this.sessions.values()) {
      if (session.personId === personId) session.personId = null;
    }
  }

  /* ---- relationships ---- */

  private relKey(accountId: string, personId: string): string {
    return `${accountId}::${personId}`;
  }

  async listRelationships(accountId: string): Promise<RelationshipRow[]> {
    return [...this.relationships.values()].filter((r) => r.accountId === accountId);
  }

  async findRelationship(accountId: string, personId: string): Promise<RelationshipRow | null> {
    return this.relationships.get(this.relKey(accountId, personId)) ?? null;
  }

  async createRelationship(input: {
    accountId: string; personId: string;
    relationType: RelationshipRow['relationType'];
  }): Promise<RelationshipRow> {
    const row: RelationshipRow = {
      id: this.id('rel'),
      accountId: input.accountId,
      personId: input.personId,
      relationType: input.relationType,
      isActive: true,
    };
    this.relationships.set(this.relKey(input.accountId, input.personId), row);
    return row;
  }

  async reassignRelationships(fromAccountId: string, toAccountId: string): Promise<number> {
    let moved = 0;
    for (const [key, rel] of [...this.relationships]) {
      if (rel.accountId !== fromAccountId) continue;
      const targetKey = this.relKey(toAccountId, rel.personId);
      this.relationships.delete(key);
      // The survivor may already hold this person; the unique index on
      // (accountId, personId) means the duplicate is dropped, not moved.
      if (!this.relationships.has(targetKey)) {
        rel.accountId = toAccountId;
        this.relationships.set(targetKey, rel);
        moved += 1;
      }
    }
    return moved;
  }

  /** Grants are not modelled here beyond their origin; see ownershipGuard. */
  readonly grantOrigins = new Map<string, string>();

  async reassignGrantOrigin(fromAccountId: string, toAccountId: string): Promise<number> {
    let n = 0;
    for (const [grantId, owner] of this.grantOrigins) {
      if (owner === fromAccountId) { this.grantOrigins.set(grantId, toAccountId); n += 1; }
    }
    return n;
  }

  /* ---- sessions ---- */

  async createSession(input: { tokenHash: string; now: Date; expiresAt: Date }):
  Promise<AnonymousSessionRow> {
    const row: AnonymousSessionRow = {
      id: this.id('ses'),
      tokenHash: input.tokenHash,
      personId: null,
      claimedByAccountId: null,
      claimedAt: null,
      createdAt: input.now,
      expiresAt: input.expiresAt,
    };
    this.sessions.set(row.id, row);
    return row;
  }

  async findSessionByTokenHash(tokenHash: string): Promise<AnonymousSessionRow | null> {
    return [...this.sessions.values()].find((s) => s.tokenHash === tokenHash) ?? null;
  }

  async attachPersonToSession(sessionId: string, personId: string): Promise<void> {
    const row = this.sessions.get(sessionId);
    if (row) row.personId = personId;
  }

  async markSessionClaimed(sessionId: string, accountId: string, now: Date): Promise<void> {
    const row = this.sessions.get(sessionId);
    if (row) { row.claimedByAccountId = accountId; row.claimedAt = now; }
  }

  /* ---- consent and audit ---- */

  async recordConsent(input: {
    personId: string; accountId: string; sensitivity: PjosSensitivity;
    purpose: string; version: string; now: Date;
  }): Promise<void> {
    // Append-only. Nothing here ever updates an earlier row.
    this.consents.push({
      personId: input.personId,
      accountId: input.accountId,
      sensitivity: input.sensitivity,
      purpose: input.purpose,
      version: input.version,
      grantedAt: input.now,
    });
  }

  async recordMerge(input: Omit<AccountMergeRow, 'id'>): Promise<AccountMergeRow> {
    const row: AccountMergeRow = { id: this.id('mrg'), ...input };
    this.merges.push(row);
    return row;
  }
}
