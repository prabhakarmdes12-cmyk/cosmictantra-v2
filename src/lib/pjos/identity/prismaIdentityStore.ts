/**
 * Prisma implementation of `IdentityRepository`.
 *
 * Thin by design. All identity policy — survivor selection, de-duplication,
 * verification rules, merge auditing — lives in `IdentityService` and is
 * tested against `InMemoryIdentityStore`. This file only has to translate,
 * and where its behaviour differs from the in-memory store, this file is the
 * one that is wrong.
 *
 * The Prisma client is typed loosely here. `prisma generate` cannot run in
 * every environment (the engine download is blocked), so `@prisma/client`
 * types are not always present; the surrounding code is written and tested
 * without them, exactly as `pjosTypes.ts` explains. The delegate shape is
 * narrow enough that the compiler would not be catching much anyway, and the
 * behaviour is covered by the in-memory contract.
 */
import type { PjosAuthChannel, PjosSensitivity } from '../../jyotish/pjosTypes';
import type {
  AccountMergeRow, AccountRow, AnonymousSessionRow, AuthIdentityRow,
  BirthDetailsInput, IdentityRepository, PersonRow, RelationshipRow,
} from './types';

/** Minimal shape of the Prisma delegates this adapter touches. */
type Delegate = {
  create: (args: any) => Promise<any>;
  findUnique: (args: any) => Promise<any>;
  findFirst: (args: any) => Promise<any>;
  findMany: (args: any) => Promise<any[]>;
  update: (args: any) => Promise<any>;
  updateMany: (args: any) => Promise<{ count: number }>;
  delete: (args: any) => Promise<any>;
  deleteMany?: (args: any) => Promise<{ count: number }>;
};

export interface PrismaLike {
  pjosAccount: Delegate;
  pjosAuthIdentity: Delegate;
  pjosPerson: Delegate;
  pjosPersonRelationship: Delegate;
  pjosAnonymousSession: Delegate;
  pjosConsentRecord: Delegate;
  pjosAccountMerge: Delegate;
  pjosAccessGrant: Delegate;
}

export class PrismaIdentityStore implements IdentityRepository {
  constructor(private readonly db: PrismaLike) {}

  /* ---- accounts ---- */

  async createAccount(input: { displayName: string | null; now: Date }): Promise<AccountRow> {
    return this.db.pjosAccount.create({
      data: { displayName: input.displayName, createdAt: input.now },
    }) as Promise<AccountRow>;
  }

  async getAccount(accountId: string): Promise<AccountRow | null> {
    return this.db.pjosAccount.findUnique({ where: { id: accountId } }) as Promise<AccountRow | null>;
  }

  async markAccountMerged(absorbedId: string, survivingId: string): Promise<void> {
    // Retained, never deleted — consent and audit rows still reference it.
    await this.db.pjosAccount.update({
      where: { id: absorbedId },
      data: { mergedIntoId: survivingId, isActive: false },
    });
  }

  /* ---- credentials ---- */

  async findIdentity(channel: PjosAuthChannel, subject: string): Promise<AuthIdentityRow | null> {
    return this.db.pjosAuthIdentity.findUnique({
      where: { channel_subject: { channel, subject } },
    }) as Promise<AuthIdentityRow | null>;
  }

  async createIdentity(input: {
    accountId: string; channel: PjosAuthChannel; subject: string;
    verifiedAt: Date | null; now: Date;
  }): Promise<AuthIdentityRow> {
    return this.db.pjosAuthIdentity.create({
      data: {
        accountId: input.accountId,
        channel: input.channel,
        subject: input.subject,
        verifiedAt: input.verifiedAt,
        createdAt: input.now,
      },
    }) as Promise<AuthIdentityRow>;
  }

  async listIdentities(accountId: string): Promise<AuthIdentityRow[]> {
    return this.db.pjosAuthIdentity.findMany({ where: { accountId } }) as Promise<AuthIdentityRow[]>;
  }

  async reassignIdentities(fromAccountId: string, toAccountId: string): Promise<number> {
    const res = await this.db.pjosAuthIdentity.updateMany({
      where: { accountId: fromAccountId },
      data: { accountId: toAccountId },
    });
    return res.count;
  }

  /* ---- persons ---- */

  async createPerson(input: BirthDetailsInput): Promise<PersonRow> {
    return this.db.pjosPerson.create({
      data: {
        displayName: input.displayName,
        birthDate: input.birthDate ?? null,
        birthTime: input.birthTime ?? null,
        birthPlace: input.birthPlace ?? null,
        birthLat: input.birthLat ?? null,
        birthLon: input.birthLon ?? null,
        isMinor: input.isMinor ?? false,
      },
    }) as Promise<PersonRow>;
  }

  async getPerson(personId: string): Promise<PersonRow | null> {
    return this.db.pjosPerson.findUnique({ where: { id: personId } }) as Promise<PersonRow | null>;
  }

  async deletePerson(personId: string): Promise<void> {
    // Relationships cascade; sessions null out (see PS-11).
    await this.db.pjosPerson.delete({ where: { id: personId } });
  }

  /* ---- relationships ---- */

  async listRelationships(accountId: string): Promise<RelationshipRow[]> {
    return this.db.pjosPersonRelationship.findMany({ where: { accountId } }) as Promise<RelationshipRow[]>;
  }

  async findRelationship(accountId: string, personId: string): Promise<RelationshipRow | null> {
    return this.db.pjosPersonRelationship.findUnique({
      where: { accountId_personId: { accountId, personId } },
    }) as Promise<RelationshipRow | null>;
  }

  async createRelationship(input: {
    accountId: string; personId: string; relationType: RelationshipRow['relationType'];
  }): Promise<RelationshipRow> {
    return this.db.pjosPersonRelationship.create({ data: input }) as Promise<RelationshipRow>;
  }

  async reassignRelationships(fromAccountId: string, toAccountId: string): Promise<number> {
    // A bulk updateMany would violate the (accountId, personId) unique index
    // wherever the survivor already holds the person, so the overlap is
    // dropped one row at a time. Merges are rare; correctness wins.
    const rows = await this.db.pjosPersonRelationship.findMany({
      where: { accountId: fromAccountId },
    }) as RelationshipRow[];

    let moved = 0;
    for (const row of rows) {
      const clash = await this.findRelationship(toAccountId, row.personId);
      if (clash) {
        await this.db.pjosPersonRelationship.delete({ where: { id: row.id } });
        continue;
      }
      await this.db.pjosPersonRelationship.update({
        where: { id: row.id },
        data: { accountId: toAccountId },
      });
      moved += 1;
    }
    return moved;
  }

  async reassignGrantOrigin(fromAccountId: string, toAccountId: string): Promise<number> {
    const res = await this.db.pjosAccessGrant.updateMany({
      where: { grantedById: fromAccountId },
      data: { grantedById: toAccountId },
    });
    return res.count;
  }

  /* ---- sessions ---- */

  async createSession(input: { tokenHash: string; now: Date; expiresAt: Date }):
  Promise<AnonymousSessionRow> {
    return this.db.pjosAnonymousSession.create({
      data: { tokenHash: input.tokenHash, createdAt: input.now, expiresAt: input.expiresAt },
    }) as Promise<AnonymousSessionRow>;
  }

  async findSessionByTokenHash(tokenHash: string): Promise<AnonymousSessionRow | null> {
    return this.db.pjosAnonymousSession.findUnique({
      where: { tokenHash },
    }) as Promise<AnonymousSessionRow | null>;
  }

  async attachPersonToSession(sessionId: string, personId: string): Promise<void> {
    await this.db.pjosAnonymousSession.update({ where: { id: sessionId }, data: { personId } });
  }

  async markSessionClaimed(sessionId: string, accountId: string, now: Date): Promise<void> {
    await this.db.pjosAnonymousSession.update({
      where: { id: sessionId },
      data: { claimedByAccountId: accountId, claimedAt: now },
    });
  }

  /* ---- consent and audit ---- */

  async recordConsent(input: {
    personId: string; accountId: string; sensitivity: PjosSensitivity;
    purpose: string; version: string; now: Date;
  }): Promise<void> {
    // Append-only: create, never update. Revocation is a later REVOKED row.
    await this.db.pjosConsentRecord.create({
      data: {
        personId: input.personId,
        accountId: input.accountId,
        sensitivity: input.sensitivity,
        status: 'GRANTED',
        purpose: input.purpose,
        version: input.version,
        grantedAt: input.now,
      },
    });
  }

  async recordMerge(input: Omit<AccountMergeRow, 'id'>): Promise<AccountMergeRow> {
    return this.db.pjosAccountMerge.create({ data: input }) as Promise<AccountMergeRow>;
  }
}
