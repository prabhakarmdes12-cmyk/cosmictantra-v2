import { test, expect } from '@playwright/test';
import {
  checkOwnership,
  assertOwnership,
  OwnershipDeniedError,
  type OwnershipRepository,
  type PjosGrantRow,
  type PjosRelationshipRow,
  type PjosConsentRow,
  type PjosPersonRow,
} from '../src/lib/pjos/ownershipGuard';
import type { PjosSensitivity, PjosGrantScope, PjosRelationshipType } from '../src/lib/jyotish/pjosTypes';

/** In-memory fake of the persistence boundary. */
class FakeRepo implements OwnershipRepository {
  persons = new Map<string, PjosPersonRow>();
  relationships = new Map<string, PjosRelationshipRow>(); // key: personId|accountId
  grants: PjosGrantRow[] = [];
  consents: PjosConsentRow[] = [];

  person(id: string, isMinor = false) {
    this.persons.set(id, { id, isMinor });
    return this;
  }
  rel(personId: string, accountId: string, relationType: PjosRelationshipType, isActive = true) {
    this.relationships.set(`${personId}|${accountId}`, { personId, relationType, guardianRole: null, isActive });
    return this;
  }
  grant(g: Partial<PjosGrantRow> & { personId: string }) {
    this.grants.push({
      granteeAccountId: null,
      granteePractitionerId: null,
      scope: 'READ',
      sensitivity: 'PERSONAL_ASTROLOGY',
      grantedAt: new Date('2026-01-01'),
      expiresAt: null,
      revokedAt: null,
      ...g,
    } as PjosGrantRow);
    return this;
  }
  consent(personId: string, sensitivity: PjosSensitivity, status: 'GRANTED' | 'REVOKED' = 'GRANTED') {
    this.consents.push({ personId, sensitivity, status, grantedAt: new Date('2026-01-01'), revokedAt: status === 'REVOKED' ? new Date() : null });
    return this;
  }

  async getPerson(id: string) {
    return this.persons.get(id) ?? null;
  }
  async findRelationship(personId: string, accountId: string) {
    return this.relationships.get(`${personId}|${accountId}`) ?? null;
  }
  async findGrantsForPerson(personId: string) {
    return this.grants.filter((g) => g.personId === personId);
  }
  async countActiveConsents(personId: string, sensitivity: PjosSensitivity) {
    // Latest event for (personId, sensitivity) wins: revocation supersedes grants.
    const events = this.consents.filter((c) => c.personId === personId && c.sensitivity === sensitivity);
    if (events.length === 0) return 0;
    const latest = events[events.length - 1];
    return latest.status === 'GRANTED' && !latest.revokedAt ? 1 : 0;
  }
}

const SELF_ACCOUNT = { accountId: 'acc-self', isProfessional: false };
const STRANGER_ACCOUNT = { accountId: 'acc-stranger', isProfessional: false };
const PANDIT = { accountId: 'acc-pandit', practitionerId: 'prac-1', isProfessional: true };

const res = (personId: string, sensitivity: PjosSensitivity, action: 'READ' | 'WRITE' = 'READ') => ({
  personId,
  sensitivity,
  action,
});

test.describe('PJOS-01-DOMAIN (D-1): Ownership Guard — resource -> person -> grant, before read/mutation', () => {
  test('1. Unauthenticated actors are denied; unknown person is indistinguishable from not-owner (no enumeration)', async () => {
    const repo = new FakeRepo().person('p1');
    const anon = await checkOwnership(repo, { isProfessional: false }, res('p1', 'PERSONAL_ASTROLOGY'));
    expect(anon).toMatchObject({ allowed: false, reason: 'UNAUTHENTICATED' });
    const notOwner = await checkOwnership(repo, STRANGER_ACCOUNT, res('p1', 'PERSONAL_ASTROLOGY'));
    const unknown = await checkOwnership(repo, STRANGER_ACCOUNT, res('ghost-person', 'PERSONAL_ASTROLOGY'));
    expect(notOwner.allowed).toBe(false);
    expect(unknown.allowed).toBe(false);
    expect(unknown.reason).toBe('UNKNOWN_PERSON');
  });

  test('2. SELF relationship reaches every sensitivity, read and write', async () => {
    const repo = new FakeRepo().person('p1').rel('p1', 'acc-self', 'SELF');
    for (const s of ['ACCOUNT_PRIVATE', 'PERSONAL_ASTROLOGY', 'CONSULTATION_CONFIDENTIAL'] as PjosSensitivity[]) {
      const r = await checkOwnership(repo, SELF_ACCOUNT, res('p1', s, 'WRITE'));
      expect(r.allowed, s).toBe(true);
    }
    // Even SELF (a family path) must not reach PANDIT_INTERNAL.
    const internal = await checkOwnership(repo, SELF_ACCOUNT, res('p1', 'PANDIT_INTERNAL'));
    expect(internal.allowed).toBe(false);
    expect(internal.reason).toBe('FAMILY_CANNOT_REACH_PANDIT_INTERNAL');
  });

  test('3. GUARDIAN_MANAGED: minors only, capped at PERSONAL_ASTROLOGY', async () => {
    const minorRepo = new FakeRepo().person('p-minor', true).rel('p-minor', 'acc-guardian', 'GUARDIAN_MANAGED');
    const ok = await checkOwnership(minorRepo, { accountId: 'acc-guardian', isProfessional: false }, res('p-minor', 'PERSONAL_ASTROLOGY', 'WRITE'));
    expect(ok.allowed).toBe(true);

    const adultRepo = new FakeRepo().person('p-adult', false).rel('p-adult', 'acc-guardian', 'GUARDIAN_MANAGED');
    const adult = await checkOwnership(adultRepo, { accountId: 'acc-guardian', isProfessional: false }, res('p-adult', 'PERSONAL_ASTROLOGY'));
    expect(adult).toMatchObject({ allowed: false, reason: 'GUARDIAN_ONLY_FOR_MINORS' });

    const internal = await checkOwnership(minorRepo, { accountId: 'acc-guardian', isProfessional: false }, res('p-minor', 'PANDIT_INTERNAL'));
    expect(internal.allowed).toBe(false);
  });

  test('4. WITH_CONSENT / IMPORTED: personal astrology only; consultation-confidential needs active consent', async () => {
    for (const relType of ['WITH_CONSENT', 'IMPORTED_FOR_PRIVATE_ANALYSIS', 'PANDIT_CLIENT'] as PjosRelationshipType[]) {
      const repo = new FakeRepo().person('p2').rel('p2', 'acc-owner', relType);
      const owner = { accountId: 'acc-owner', isProfessional: false };
      expect((await checkOwnership(repo, owner, res('p2', 'PERSONAL_ASTROLOGY'))).allowed).toBe(true);
      const noConsent = await checkOwnership(repo, owner, res('p2', 'CONSULTATION_CONFIDENTIAL'));
      expect(noConsent).toMatchObject({ allowed: false, reason: 'CONSENT_REQUIRED' });
      repo.consent('p2', 'CONSULTATION_CONFIDENTIAL');
      const withConsent = await checkOwnership(repo, owner, res('p2', 'CONSULTATION_CONFIDENTIAL'));
      expect(withConsent.allowed).toBe(true);
      // A later REVOKED event is the latest record for that sensitivity =>
      // the consent path closes again (append-only records, latest wins).
      repo.consent('p2', 'CONSULTATION_CONFIDENTIAL', 'REVOKED');
      const afterRevoke = await checkOwnership(repo, owner, res('p2', 'CONSULTATION_CONFIDENTIAL'));
      expect(afterRevoke).toMatchObject({ allowed: false, reason: 'CONSENT_REQUIRED' });
    }
  });

  test('5. Professional path: grant scope + sensitivity gate the action', async () => {
    const repo = new FakeRepo().person('p3').grant({ personId: 'p3', granteePractitionerId: 'prac-1', scope: 'READ', sensitivity: 'PERSONAL_ASTROLOGY' });
    expect((await checkOwnership(repo, PANDIT, res('p3', 'PERSONAL_ASTROLOGY', 'READ'))).allowed).toBe(true);
    const write = await checkOwnership(repo, PANDIT, res('p3', 'PERSONAL_ASTROLOGY', 'WRITE'));
    expect(write).toMatchObject({ allowed: false, reason: 'SCOPE_MISMATCH' });
    const confidential = await checkOwnership(repo, PANDIT, res('p3', 'CONSULTATION_CONFIDENTIAL'));
    expect(confidential).toMatchObject({ allowed: false, reason: 'SENSITIVITY_MISMATCH' });

    // Grant with MANAGE + PANDIT_INTERNAL, but person is not a PANDIT_CLIENT -> denied.
    const repo2 = new FakeRepo().person('p4').grant({ personId: 'p4', granteePractitionerId: 'prac-1', scope: 'MANAGE', sensitivity: 'PANDIT_INTERNAL' });
    const noClientRel = await checkOwnership(repo2, PANDIT, res('p4', 'PANDIT_INTERNAL'));
    expect(noClientRel).toMatchObject({ allowed: false, reason: 'PANDIT_CLIENT_RELATIONSHIP_REQUIRED' });

    // With the PANDIT_CLIENT relationship, the professional workspace opens.
    repo2.rel('p4', 'acc-pandit', 'PANDIT_CLIENT');
    const withClientRel = await checkOwnership(repo2, PANDIT, res('p4', 'PANDIT_INTERNAL', 'WRITE'));
    expect(withClientRel.allowed).toBe(true);
    expect(withClientRel.path).toBe('PROFESSIONAL');
  });

  test('6. Revoked or expired grants deny; active grants win', async () => {
    const repo = new FakeRepo()
      .person('p5')
      .grant({ personId: 'p5', granteePractitionerId: 'prac-1', scope: 'READ', sensitivity: 'PERSONAL_ASTROLOGY', revokedAt: new Date('2026-08-01') });
    const revoked = await checkOwnership(repo, PANDIT, res('p5', 'PERSONAL_ASTROLOGY'));
    expect(revoked).toMatchObject({ allowed: false, reason: 'GRANT_REVOKED' });

    const repo2 = new FakeRepo()
      .person('p6')
      .grant({ personId: 'p6', granteePractitionerId: 'prac-1', scope: 'READ', sensitivity: 'PERSONAL_ASTROLOGY', expiresAt: new Date('2026-01-01') });
    const expired = await checkOwnership(repo2, PANDIT, res('p6', 'PERSONAL_ASTROLOGY'));
    expect(expired).toMatchObject({ allowed: false, reason: 'GRANT_EXPIRED' });

    const repo3 = new FakeRepo()
      .person('p7')
      .grant({ personId: 'p7', granteePractitionerId: 'other-prac', scope: 'READ' })
      .grant({ personId: 'p7', granteePractitionerId: 'prac-1', scope: 'READ', sensitivity: 'PERSONAL_ASTROLOGY' });
    const ok = await checkOwnership(repo3, PANDIT, res('p7', 'PERSONAL_ASTROLOGY'));
    expect(ok.allowed).toBe(true);
  });

  test('7. Inactive relationship denies; assertOwnership throws a typed error without leaking person ids', async () => {
    const repo = new FakeRepo().person('p8').rel('p8', 'acc-self', 'SELF', false);
    expect(await checkOwnership(repo, SELF_ACCOUNT, res('p8', 'PERSONAL_ASTROLOGY'))).toMatchObject({
      allowed: false,
      reason: 'RELATIONSHIP_INACTIVE',
    });
    await expect(assertOwnership(repo, SELF_ACCOUNT, res('p8', 'PERSONAL_ASTROLOGY'))).rejects.toThrow(OwnershipDeniedError);
    try {
      await assertOwnership(repo, SELF_ACCOUNT, res('p8', 'PERSONAL_ASTROLOGY'));
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as OwnershipDeniedError).reason).toBe('RELATIONSHIP_INACTIVE');
      expect((e as Error).message).not.toContain('p8'); // no person identifier in the message
    }
  });

  test('8. Mutation actions require elevated scope (WRITE above READ)', async () => {
    const repo = new FakeRepo()
      .person('p9')
      .grant({ personId: 'p9', granteeAccountId: 'acc-family', scope: 'READ', sensitivity: 'PERSONAL_ASTROLOGY' })
      .rel('p9', 'acc-family', 'WITH_CONSENT');
    // Family account path allows write for personal astrology of a consented adult.
    const family = { accountId: 'acc-family', isProfessional: false };
    expect((await checkOwnership(repo, family, res('p9', 'PERSONAL_ASTROLOGY', 'WRITE'))).allowed).toBe(true);
  });
});
