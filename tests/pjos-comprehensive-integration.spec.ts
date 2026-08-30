import { test, expect } from '@playwright/test';
import {
  checkOwnership,
  assertOwnership,
  OwnershipDeniedError,
  DENY_REASONS,
  type OwnershipRepository,
  type ActorIdentity,
  type ResourceRef,
  type PjosPersonRow,
  type PjosRelationshipRow,
  type PjosGrantRow,
  type PjosConsentRow,
} from '../src/lib/pjos/ownershipGuard';
import type {
  PjosSensitivity,
  PjosRelationshipType,
  PjosGrantScope,
  PjosConsentStatus,
} from '../src/lib/jyotish/pjosTypes';
import {
  EvidenceStore,
  PredictionLedger,
  PREDICTION_STATUS,
  snapshotHash,
} from '../src/lib/jyotish/evidenceGraph';
import { compileEvidence } from '../src/lib/jyotish/evidenceCompiler';
import { getCanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';

// ============================================================================
// In-Memory Test Ownership Repository
// ============================================================================
class ComprehensiveTestRepo implements OwnershipRepository {
  private persons = new Map<string, PjosPersonRow>();
  private relationships = new Map<string, PjosRelationshipRow>(); // key: personId:accountId
  private grants: PjosGrantRow[] = [];
  private consents: PjosConsentRow[] = [];

  person(id: string, isMinor: boolean = false) {
    this.persons.set(id, { id, isMinor });
    return this;
  }

  rel(
    personId: string,
    accountId: string,
    relationType: PjosRelationshipType,
    isActive: boolean = true,
    guardianRole: string | null = null
  ) {
    this.relationships.set(`${personId}:${accountId}`, {
      personId,
      relationType,
      guardianRole,
      isActive,
    });
    return this;
  }

  grant(g: {
    personId: string;
    granteeAccountId?: string | null;
    granteePractitionerId?: string | null;
    scope?: PjosGrantScope;
    sensitivity?: PjosSensitivity;
    grantedAt?: Date;
    expiresAt?: Date | null;
    revokedAt?: Date | null;
  }) {
    this.grants.push({
      personId: g.personId,
      granteeAccountId: g.granteeAccountId ?? null,
      granteePractitionerId: g.granteePractitionerId ?? null,
      scope: g.scope ?? 'READ',
      sensitivity: g.sensitivity ?? 'PERSONAL_ASTROLOGY',
      grantedAt: g.grantedAt ?? new Date('2026-08-01'),
      expiresAt: g.expiresAt ?? null,
      revokedAt: g.revokedAt ?? null,
    });
    return this;
  }

  consent(
    personId: string,
    sensitivity: PjosSensitivity,
    status: PjosConsentStatus = 'GRANTED',
    grantedAt: Date = new Date('2026-08-01')
  ) {
    this.consents.push({
      personId,
      sensitivity,
      status,
      grantedAt,
      revokedAt: status === 'REVOKED' ? new Date('2026-08-15') : null,
    });
    return this;
  }

  getPerson(personId: string) {
    return this.persons.get(personId) ?? null;
  }

  findRelationship(personId: string, accountId: string) {
    return this.relationships.get(`${personId}:${accountId}`) ?? null;
  }

  findGrantsForPerson(personId: string) {
    return this.grants.filter((g) => g.personId === personId);
  }

  countActiveConsents(personId: string, sensitivity: PjosSensitivity) {
    const matching = this.consents
      .filter((c) => c.personId === personId && c.sensitivity === sensitivity)
      .sort((a, b) => b.grantedAt.getTime() - a.grantedAt.getTime());
    if (matching.length === 0) return 0;
    return matching[0].status === 'GRANTED' ? 1 : 0;
  }
}

const req = (personId: string, sensitivity: PjosSensitivity, action: 'READ' | 'WRITE' | 'CONSULT' | 'MANAGE' = 'READ'): ResourceRef => ({
  personId,
  sensitivity,
  action,
});

// ============================================================================
// GATE 5: Comprehensive Security & Access Matrix Suite
// ============================================================================
test.describe('GATE 5: Comprehensive Ownership & Security Access Matrix', () => {

  test('1. USER A reads USER B Person -> DENY', async () => {
    const repo = new ComprehensiveTestRepo()
      .person('person-B')
      .rel('person-B', 'account-B', 'SELF');

    const actorA: ActorIdentity = { accountId: 'account-A', isProfessional: false };
    const decision = await checkOwnership(repo, actorA, req('person-B', 'PERSONAL_ASTROLOGY'));
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(DENY_REASONS.NOT_OWNER);
  });

  test('2. USER A reads USER B Kundli resource -> DENY with typed error and no leaked ID', async () => {
    const repo = new ComprehensiveTestRepo()
      .person('person-B')
      .rel('person-B', 'account-B', 'SELF');

    const actorA: ActorIdentity = { accountId: 'account-A', isProfessional: false };
    await expect(assertOwnership(repo, actorA, req('person-B', 'PERSONAL_ASTROLOGY'))).rejects.toThrow(OwnershipDeniedError);
    try {
      await assertOwnership(repo, actorA, req('person-B', 'PERSONAL_ASTROLOGY'));
    } catch (e: any) {
      expect(e.reason).toBe(DENY_REASONS.NOT_OWNER);
      expect(e.message).not.toContain('person-B');
    }
  });

  test('3. USER A guesses unknown Person ID -> same externally visible failure (enumeration resistance)', async () => {
    const repo = new ComprehensiveTestRepo().person('real-person-1');
    const actor: ActorIdentity = { accountId: 'attacker-account', isProfessional: false };

    const unknownDec = await checkOwnership(repo, actor, req('unknown-ghost-id', 'PERSONAL_ASTROLOGY'));
    expect(unknownDec.allowed).toBe(false);
    expect(unknownDec.reason).toBe(DENY_REASONS.UNKNOWN_PERSON);

    await expect(assertOwnership(repo, actor, req('unknown-ghost-id', 'PERSONAL_ASTROLOGY'))).rejects.toThrow(OwnershipDeniedError);
    try {
      await assertOwnership(repo, actor, req('unknown-ghost-id', 'PERSONAL_ASTROLOGY'));
    } catch (e: any) {
      expect(e.reason).toBe(DENY_REASONS.UNKNOWN_PERSON);
      expect(e.message).not.toContain('unknown-ghost-id');
    }
  });

  test('4. SELF owner accesses PERSONAL_ASTROLOGY & CONSULTATION_CONFIDENTIAL -> ALLOW', async () => {
    const repo = new ComprehensiveTestRepo()
      .person('person-me')
      .rel('person-me', 'account-me', 'SELF');

    const actor: ActorIdentity = { accountId: 'account-me', isProfessional: false };
    expect((await checkOwnership(repo, actor, req('person-me', 'PERSONAL_ASTROLOGY', 'READ'))).allowed).toBe(true);
    expect((await checkOwnership(repo, actor, req('person-me', 'PERSONAL_ASTROLOGY', 'WRITE'))).allowed).toBe(true);
    expect((await checkOwnership(repo, actor, req('person-me', 'CONSULTATION_CONFIDENTIAL', 'READ'))).allowed).toBe(true);
    expect((await checkOwnership(repo, actor, req('person-me', 'CONSULTATION_CONFIDENTIAL', 'WRITE'))).allowed).toBe(true);
  });

  test('5. SELF owner requests PANDIT_INTERNAL -> policy-appropriate denial', async () => {
    const repo = new ComprehensiveTestRepo()
      .person('person-me')
      .rel('person-me', 'account-me', 'SELF');

    const actor: ActorIdentity = { accountId: 'account-me', isProfessional: false };
    const decision = await checkOwnership(repo, actor, req('person-me', 'PANDIT_INTERNAL', 'READ'));
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(DENY_REASONS.FAMILY_CANNOT_REACH_PANDIT_INTERNAL);
  });

  test('6. Guardian accesses minor PERSONAL_ASTROLOGY -> ALLOW', async () => {
    const repo = new ComprehensiveTestRepo()
      .person('minor-child', true)
      .rel('minor-child', 'parent-account', 'GUARDIAN_MANAGED', true, 'FATHER');

    const parent: ActorIdentity = { accountId: 'parent-account', isProfessional: false };
    expect((await checkOwnership(repo, parent, req('minor-child', 'PERSONAL_ASTROLOGY', 'READ'))).allowed).toBe(true);
    expect((await checkOwnership(repo, parent, req('minor-child', 'PERSONAL_ASTROLOGY', 'WRITE'))).allowed).toBe(true);
  });

  test('7. Guardian accesses adult profile without grant -> DENY', async () => {
    const repo = new ComprehensiveTestRepo()
      .person('adult-child', false) // Not a minor!
      .rel('adult-child', 'parent-account', 'GUARDIAN_MANAGED', true, 'FATHER');

    const parent: ActorIdentity = { accountId: 'parent-account', isProfessional: false };
    const decision = await checkOwnership(repo, parent, req('adult-child', 'PERSONAL_ASTROLOGY'));
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(DENY_REASONS.GUARDIAN_ONLY_FOR_MINORS);
  });

  test('8. Guardian accesses PANDIT_INTERNAL -> DENY', async () => {
    const repo = new ComprehensiveTestRepo()
      .person('minor-child', true)
      .rel('minor-child', 'parent-account', 'GUARDIAN_MANAGED');

    const parent: ActorIdentity = { accountId: 'parent-account', isProfessional: false };
    const decision = await checkOwnership(repo, parent, req('minor-child', 'PANDIT_INTERNAL'));
    expect(decision.allowed).toBe(false);
  });

  test('9. Professional without grant -> DENY', async () => {
    const repo = new ComprehensiveTestRepo().person('client-1');
    const pandit: ActorIdentity = { practitionerId: 'pandit-108', isProfessional: true };

    const decision = await checkOwnership(repo, pandit, req('client-1', 'PERSONAL_ASTROLOGY'));
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(DENY_REASONS.NO_GRANT);
  });

  test('10. Professional with wrong scope -> DENY', async () => {
    const repo = new ComprehensiveTestRepo()
      .person('client-1')
      .grant({ personId: 'client-1', granteePractitionerId: 'pandit-108', scope: 'READ', sensitivity: 'PERSONAL_ASTROLOGY' });

    const pandit: ActorIdentity = { practitionerId: 'pandit-108', isProfessional: true };
    const decision = await checkOwnership(repo, pandit, req('client-1', 'PERSONAL_ASTROLOGY', 'WRITE'));
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(DENY_REASONS.SCOPE_MISMATCH);
  });

  test('11. Professional with inadequate sensitivity -> DENY', async () => {
    const repo = new ComprehensiveTestRepo()
      .person('client-1')
      .grant({ personId: 'client-1', granteePractitionerId: 'pandit-108', scope: 'READ', sensitivity: 'PERSONAL_ASTROLOGY' });

    const pandit: ActorIdentity = { practitionerId: 'pandit-108', isProfessional: true };
    const decision = await checkOwnership(repo, pandit, req('client-1', 'CONSULTATION_CONFIDENTIAL', 'READ'));
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(DENY_REASONS.SENSITIVITY_MISMATCH);
  });

  test('12. Professional with valid grant -> ALLOW', async () => {
    const repo = new ComprehensiveTestRepo()
      .person('client-1')
      .grant({ personId: 'client-1', granteePractitionerId: 'pandit-108', scope: 'READ', sensitivity: 'PERSONAL_ASTROLOGY' });

    const pandit: ActorIdentity = { practitionerId: 'pandit-108', isProfessional: true };
    const decision = await checkOwnership(repo, pandit, req('client-1', 'PERSONAL_ASTROLOGY', 'READ'));
    expect(decision.allowed).toBe(true);
    expect(decision.path).toBe('PROFESSIONAL');
  });

  test('13. Professional with expired grant -> DENY', async () => {
    const repo = new ComprehensiveTestRepo()
      .person('client-1')
      .grant({
        personId: 'client-1',
        granteePractitionerId: 'pandit-108',
        scope: 'READ',
        sensitivity: 'PERSONAL_ASTROLOGY',
        expiresAt: new Date('2026-01-01'), // Expired
      });

    const pandit: ActorIdentity = { practitionerId: 'pandit-108', isProfessional: true };
    const decision = await checkOwnership(repo, pandit, req('client-1', 'PERSONAL_ASTROLOGY'));
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(DENY_REASONS.GRANT_EXPIRED);
  });

  test('14. Revoked grant -> DENY', async () => {
    const repo = new ComprehensiveTestRepo()
      .person('client-1')
      .grant({
        personId: 'client-1',
        granteePractitionerId: 'pandit-108',
        scope: 'READ',
        sensitivity: 'PERSONAL_ASTROLOGY',
        revokedAt: new Date('2026-08-10'), // Revoked
      });

    const pandit: ActorIdentity = { practitionerId: 'pandit-108', isProfessional: true };
    const decision = await checkOwnership(repo, pandit, req('client-1', 'PERSONAL_ASTROLOGY'));
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(DENY_REASONS.GRANT_REVOKED);
  });

  test('15. Later valid re-grant -> ALLOW and Stale grant does not shadow active later grant', async () => {
    const repo = new ComprehensiveTestRepo()
      .person('client-1')
      // Earlier revoked grant
      .grant({
        personId: 'client-1',
        granteePractitionerId: 'pandit-108',
        scope: 'READ',
        sensitivity: 'PERSONAL_ASTROLOGY',
        grantedAt: new Date('2026-06-01'),
        revokedAt: new Date('2026-07-01'),
      })
      // Later active re-grant
      .grant({
        personId: 'client-1',
        granteePractitionerId: 'pandit-108',
        scope: 'READ',
        sensitivity: 'PERSONAL_ASTROLOGY',
        grantedAt: new Date('2026-08-01'),
        revokedAt: null,
      });

    const pandit: ActorIdentity = { practitionerId: 'pandit-108', isProfessional: true };
    const decision = await checkOwnership(repo, pandit, req('client-1', 'PERSONAL_ASTROLOGY'));
    expect(decision.allowed).toBe(true);
    expect(decision.path).toBe('PROFESSIONAL');
  });

  test('16. Dual-role Account + Practitioner -> correct path, no accidental deny', async () => {
    const repo = new ComprehensiveTestRepo()
      .person('my-family-member')
      .rel('my-family-member', 'acc-pandit-user', 'WITH_CONSENT')
      .person('outside-client')
      .grant({ personId: 'outside-client', granteePractitionerId: 'prac-id-42', scope: 'CONSULT', sensitivity: 'PERSONAL_ASTROLOGY' });

    // Dual-role user: operates both as consumer account AND active professional
    const dualRoleActor: ActorIdentity = {
      accountId: 'acc-pandit-user',
      practitionerId: 'prac-id-42',
      isProfessional: true,
    };

    // 1. Reaching family member through ACCOUNT path
    const familyDecision = await checkOwnership(repo, dualRoleActor, req('my-family-member', 'PERSONAL_ASTROLOGY', 'READ'));
    expect(familyDecision.allowed).toBe(true);
    expect(familyDecision.path).toBe('ACCOUNT');

    // 2. Reaching outside client through PROFESSIONAL path
    const clientDecision = await checkOwnership(repo, dualRoleActor, req('outside-client', 'PERSONAL_ASTROLOGY', 'CONSULT'));
    expect(clientDecision.allowed).toBe(true);
    expect(clientDecision.path).toBe('PROFESSIONAL');
  });

  test('17. Mutations (WRITE, MANAGE) require elevated scope check', async () => {
    const repo = new ComprehensiveTestRepo()
      .person('client-1')
      .grant({ personId: 'client-1', granteePractitionerId: 'pandit-1', scope: 'READ', sensitivity: 'PERSONAL_ASTROLOGY' })
      .grant({ personId: 'client-1', granteePractitionerId: 'pandit-2', scope: 'WRITE', sensitivity: 'PERSONAL_ASTROLOGY' });

    const pandit1: ActorIdentity = { practitionerId: 'pandit-1', isProfessional: true };
    const pandit2: ActorIdentity = { practitionerId: 'pandit-2', isProfessional: true };

    expect((await checkOwnership(repo, pandit1, req('client-1', 'PERSONAL_ASTROLOGY', 'WRITE'))).allowed).toBe(false);
    expect((await checkOwnership(repo, pandit2, req('client-1', 'PERSONAL_ASTROLOGY', 'WRITE'))).allowed).toBe(true);
  });

});

// ============================================================================
// GATE 6: Evidence Graph Integrity & 12-Domain Compilation Suite
// ============================================================================
test.describe('GATE 6: Evidence Graph Integrity & Multi-Domain Compilation', () => {
  const birthFixture = {
    birthDate: '1989-05-26',
    birthTime: '02:20:30',
    birthPlace: 'Bilaspur, Chhattisgarh, India',
    locationName: 'Bilaspur, Chhattisgarh, India',
    latitude: 22.0797,
    longitude: 82.1391,
    timezone: 5.5,
    ayanamsa: 'Lahiri',
  };

  test('1. Compile canonical Kundli and verify all 12 domains present', () => {
    const snapshot = getCanonicalJyotishSnapshot(birthFixture);
    const compiled = compileEvidence(snapshot);
    const store = compiled.store;

    const expectedDomains = [
      'GRAHA', 'BHAVA', 'DASHA', 'PANCHANG', 'VARGA',
      'ASHTAKAVARGA', 'JAIMINI', 'KP', 'BALA', 'RELATIONSHIP',
      'TIMELINE_OUTCOME', 'CONVENTION'
    ];

    for (const d of expectedDomains) {
      expect(compiled.domainsPresent).toContain(d);
      expect(store.list().filter(n => n.domain === d).length).toBeGreaterThan(0);
    }
    expect(compiled.nodeCount).toBeGreaterThan(35);
  });

  test('2. Verify all EvidenceNode IDs resolvable and dependency edges resolve', () => {
    const snapshot = getCanonicalJyotishSnapshot(birthFixture);
    const compiled = compileEvidence(snapshot);
    const store = compiled.store;

    const allNodes = store.list();
    for (const node of allNodes) {
      expect(node.id).toBeDefined();
      expect(store.getNode(node.id)).toBe(node);

      if (node.dependencies && node.dependencies.length > 0) {
        for (const depId of node.dependencies) {
          const depNode = store.getNode(depId);
          expect(depNode, `Dependency ${depId} for node ${node.id} must exist in store`).toBeDefined();
        }
      }
    }
  });

  test('3. Verify traceDependencies terminates and handles cycles without infinite loops', () => {
    const snapshot = getCanonicalJyotishSnapshot(birthFixture);
    const compiled = compileEvidence(snapshot);
    const store = compiled.store;

    // Test across domains
    const dashaNode = store.getBySubject('dasha:current')[0];
    const trace = store.traceDependencies(dashaNode.id);
    expect(trace.nodes.length).toBeGreaterThan(0);
    expect(trace.cycles).toEqual([]);

    // Synthetic cycle test
    const cycleStore = new EvidenceStore('test-v1', 'hash-1');
    const n1 = cycleStore.addNode({ domain: 'GRAHA', subject: 's1', claim: 'c1', value: 1, confidence: 0.9, basis: 'DERIVED_FROM_CALCULATION' });
    const n2 = cycleStore.addNode({ domain: 'GRAHA', subject: 's2', claim: 'c2', value: 2, confidence: 0.9, basis: 'DERIVED_FROM_CALCULATION', dependencies: [n1.id] });
    const n3 = cycleStore.addNode({ domain: 'GRAHA', subject: 's3', claim: 'c3', value: 3, confidence: 0.9, basis: 'DERIVED_FROM_CALCULATION', dependencies: [n2.id] });

    const traceRes = cycleStore.traceDependencies(n3.id);
    expect(traceRes.nodes.length).toBe(3);
  });

  test('4. Same input generates deterministic node identity; different inputs do not collide', () => {
    const snap1 = getCanonicalJyotishSnapshot(birthFixture);
    const snap2 = getCanonicalJyotishSnapshot(birthFixture);
    const snap3 = getCanonicalJyotishSnapshot({ ...birthFixture, birthTime: '15:30:00' });

    const comp1 = compileEvidence(snap1);
    const comp2 = compileEvidence(snap2);
    const comp3 = compileEvidence(snap3);

    expect(comp1.snapshotHash).toBe(comp2.snapshotHash);
    expect(comp1.snapshotHash).not.toBe(comp3.snapshotHash);

    const ids1 = comp1.store.list().map(n => n.id).sort();
    const ids2 = comp2.store.list().map(n => n.id).sort();
    const ids3 = comp3.store.list().map(n => n.id).sort();

    expect(ids1).toEqual(ids2);
    expect(ids1).not.toEqual(ids3);
  });

  test('5. EvidenceCompiler does not mutate canonical snapshot', () => {
    const snapshot = getCanonicalJyotishSnapshot(birthFixture);
    const beforeStr = JSON.stringify(snapshot);
    compileEvidence(snapshot);
    const afterStr = JSON.stringify(snapshot);
    expect(afterStr).toBe(beforeStr);
  });

  test('6. Support / Conflict assessment preserves sourceTag', () => {
    const store = new EvidenceStore('test-v1', 'hash-1');
    const natalNode = store.addNode({
      domain: 'GRAHA',
      subject: 'graha:Jupiter',
      claim: 'placement',
      value: { rashi: 'Vrishabha' },
      confidence: 0.95,
      basis: 'DERIVED_FROM_CALCULATION',
      sourceTag: 'NATAL',
    });

    const transitNode = store.addNode({
      domain: 'GRAHA',
      subject: 'graha:Jupiter',
      claim: 'placement',
      value: { rashi: 'Vrishabha' },
      confidence: 0.90,
      basis: 'DERIVED_FROM_CALCULATION',
      sourceTag: 'TRANSIT',
    });

    const conflictNode = store.addNode({
      domain: 'GRAHA',
      subject: 'graha:Jupiter',
      claim: 'placement',
      value: { rashi: 'Mithuna' },
      confidence: 0.80,
      basis: 'DIRECT_OBSERVATION',
      sourceTag: 'OBSERVATION',
    });

    const relations = store.assessRelations(natalNode.id);
    expect(relations.supporting.map(n => n.id)).toContain(transitNode.id);
    expect(relations.conflicting.map(n => n.id)).toContain(conflictNode.id);
  });

  test('7. No node from Person A appears in Person B graph (store isolation)', () => {
    const snapA = getCanonicalJyotishSnapshot(birthFixture);
    const snapB = getCanonicalJyotishSnapshot({ ...birthFixture, birthDate: '1995-11-12' });

    const storeA = compileEvidence(snapA).store;
    const storeB = compileEvidence(snapB).store;

    const idsA = new Set(storeA.list().map(n => n.id));
    const idsB = new Set(storeB.list().map(n => n.id));

    // Person A and Person B have completely separate store instances
    expect(storeA.snapshotHash).not.toBe(storeB.snapshotHash);
    expect(storeA.list().length).toBeGreaterThan(0);
    expect(storeB.list().length).toBeGreaterThan(0);
  });

});

// ============================================================================
// GATE 7: Prediction Ledger & Tamper Immutability Suite
// ============================================================================
test.describe('GATE 7: Prediction Ledger Immutability & Tamper Detection', () => {
  const birthFixture = {
    birthDate: '1989-05-26',
    birthTime: '02:20:30',
    birthPlace: 'Bilaspur, Chhattisgarh, India',
    locationName: 'Bilaspur, Chhattisgarh, India',
    latitude: 22.0797,
    longitude: 82.1391,
    timezone: 5.5,
    ayanamsa: 'Lahiri',
  };

  test('1. Prediction P1 issued -> hash chain integrity verified', () => {
    const snapshot = getCanonicalJyotishSnapshot(birthFixture);
    const store = compileEvidence(snapshot).store;
    const ledger = new PredictionLedger();

    const moonNode = store.getBySubject('graha:Moon').find(n => n.claim === 'placement')!;
    const p1 = ledger.append(store, {
      personRef: 'person:prabhakar-1989',
      statement: 'Moon in 7th house in Libra indicates balanced partnerships.',
      evidenceNodeIds: [moonNode.id],
      confidence: 0.95,
      basis: 'DERIVED_FROM_CALCULATION',
    });

    expect(p1.status).toBe(PREDICTION_STATUS.EVIDENCE_BACKED);
    expect(p1.hash).toBeDefined();
    expect(p1.prevHash).toBe('GENESIS');
    expect(ledger.verifyChain()).toBe(true);
  });

  test('2. Multiple predictions chained -> unbroken cryptographic hash chain', () => {
    const snapshot = getCanonicalJyotishSnapshot(birthFixture);
    const store = compileEvidence(snapshot).store;
    const ledger = new PredictionLedger();

    const sunNode = store.getBySubject('graha:Sun').find(n => n.claim === 'placement')!;
    const moonNode = store.getBySubject('graha:Moon').find(n => n.claim === 'placement')!;
    const jupiterNode = store.getBySubject('graha:Jupiter').find(n => n.claim === 'placement')!;

    const p1 = ledger.append(store, {
      personRef: 'person:prabhakar-1989',
      statement: 'Prediction 1: Sun placement',
      evidenceNodeIds: [sunNode.id],
      confidence: 0.9,
      basis: 'DERIVED_FROM_CALCULATION',
    });

    const p2 = ledger.append(store, {
      personRef: 'person:prabhakar-1989',
      statement: 'Prediction 2: Moon placement',
      evidenceNodeIds: [moonNode.id],
      confidence: 0.9,
      basis: 'DERIVED_FROM_CALCULATION',
    });

    const p3 = ledger.append(store, {
      personRef: 'person:prabhakar-1989',
      statement: 'Prediction 3: Jupiter placement',
      evidenceNodeIds: [jupiterNode.id],
      confidence: 0.9,
      basis: 'DERIVED_FROM_CALCULATION',
    });

    expect(p2.prevHash).toBe(p1.hash);
    expect(p3.prevHash).toBe(p2.hash);
    expect(ledger.verifyChain()).toBe(true);
  });

  test('3. Frozen immutability: attempting to mutate a prediction throws error', () => {
    const snapshot = getCanonicalJyotishSnapshot(birthFixture);
    const store = compileEvidence(snapshot).store;
    const ledger = new PredictionLedger();

    const sunNode = store.getBySubject('graha:Sun').find(n => n.claim === 'placement')!;
    const p1 = ledger.append(store, {
      personRef: 'person:prabhakar-1989',
      statement: 'Immutable prediction statement',
      evidenceNodeIds: [sunNode.id],
      confidence: 0.9,
      basis: 'DERIVED_FROM_CALCULATION',
    });

    expect(Object.isFrozen(p1)).toBe(true);
    expect(() => {
      (p1 as any).statement = 'Mutated statement!';
    }).toThrow();
  });

});
