import { test, expect } from '@playwright/test';
import { getCanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';
import { compileEvidence } from '../src/lib/jyotish/evidenceCompiler';
import { snapshotHash } from '../src/lib/jyotish/evidenceGraph';
import type {
  PjosDb,
  PjosPersonRecord,
  PjosRelationshipRecord,
  PjosGrantRecord,
  PjosConsentRecordRow,
  PjosAccountRecord,
  PjosKundliRecordRow,
  PjosPredictionRecordRow,
} from '../src/lib/pjos/prismaRepository';
import { PrismaOwnershipRepository } from '../src/lib/pjos/prismaRepository';
import {
  persistKundliRecord,
  buildEvidenceForKundli,
  appendPredictionToKundli,
  verifyKundliPredictionChain,
} from '../src/lib/pjos/kundliPersistence';
import {
  createPjosSessionToken,
  verifyPjosSessionToken,
} from '../src/lib/pjos/session';
import {
  handleListPersons,
  handleCreatePerson,
  handleCreateKundli,
  handleGetKundli,
  handleCreatePrediction,
  handleListPredictions,
} from '../src/lib/pjos/routes';
import type { PjosActor } from '../src/lib/pjos/session';

/* ------------------------------------------------------------------ */
/* In-memory fake of the PJOS database (satisfies the structural PjosDb) */
/* ------------------------------------------------------------------ */

class FakePjosDb implements PjosDb {
  persons: PjosPersonRecord[] = [];
  relationships: PjosRelationshipRecord[] = [];
  grants: PjosGrantRecord[] = [];
  consents: PjosConsentRecordRow[] = [];
  accounts: PjosAccountRecord[] = [];
  kundli: PjosKundliRecordRow[] = [];
  predictions: PjosPredictionRecordRow[] = [];
  private seq = 0;
  private uid() {
    return `id-${++this.seq}`;
  }

  pjosPerson = {
    findUnique: async ({ where }: { where: { id: string } }) => this.persons.find((p) => p.id === where.id) ?? null,
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const p: PjosPersonRecord = {
        id: this.uid(),
        displayName: (data.displayName as string) ?? '',
        isMinor: Boolean(data.isMinor),
        birthDate: null as never,
        birthTime: null as never,
        birthPlace: null as never,
        birthLat: null as never,
        birthLon: null as never,
        projectId: 'cosmic-tantra',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.persons.push(p);
      return p;
    },
    findMany: async () => this.persons,
  };

  pjosAccount = {
    findUnique: async ({ where }: { where: { authChannel_authSubject: { authChannel: never; authSubject: string } } }) =>
      this.accounts.find((a) => a.authChannel === where.authChannel_authSubject.authChannel && a.authSubject === where.authChannel_authSubject.authSubject) ?? null,
    upsert: async ({ where, create }: { where: { authChannel_authSubject: { authChannel: never; authSubject: string } }; create: Record<string, unknown>; update: Record<string, unknown> }) => {
      const existing = await this.pjosAccount.findUnique({ where });
      if (existing) return existing;
      const a: PjosAccountRecord = {
        id: this.uid(),
        authChannel: where.authChannel_authSubject.authChannel as never,
        authSubject: where.authChannel_authSubject.authSubject,
        displayName: null,
        isActive: true,
      };
      this.accounts.push(a);
      return a;
    },
  };

  pjosPersonRelationship = {
    findUnique: async ({ where }: { where: { accountId_personId: { accountId: string; personId: string } } }) =>
      this.relationships.find((r) => r.accountId === where.accountId_personId.accountId && r.personId === where.accountId_personId.personId) ?? null,
    findMany: async ({ where }: { where: { accountId: string; isActive?: boolean } }) =>
      this.relationships.filter((r) => r.accountId === where.accountId && (where.isActive === undefined || r.isActive === where.isActive)),
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const r: PjosRelationshipRecord = {
        id: this.uid(),
        accountId: data.accountId as string,
        personId: data.personId as string,
        relationType: (data.relationType as never) ?? 'SELF',
        guardianRole: (data.guardianRole as string | null) ?? null,
        isActive: true,
      };
      this.relationships.push(r);
      return r;
    },
  };

  pjosAccessGrant = {
    findMany: async ({ where }: { where: { personId: string } }) => this.grants.filter((g) => g.personId === where.personId),
  };

  pjosConsentRecord = {
    findMany: async ({ where, orderBy: _o }: { where: { personId: string; sensitivity: never }; orderBy: { grantedAt: 'asc' | 'desc' } }) =>
      this.consents
        .filter((c) => c.personId === where.personId && c.sensitivity === where.sensitivity)
        .sort((a, b) => a.grantedAt.getTime() - b.grantedAt.getTime()),
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const c: PjosConsentRecordRow = {
        id: this.uid(),
        personId: data.personId as string,
        accountId: (data.accountId as string | null) ?? null,
        sensitivity: data.sensitivity as never,
        status: (data.status as never) ?? 'GRANTED',
        purpose: (data.purpose as string) ?? '',
        version: (data.version as string) ?? 'v1',
        grantedAt: new Date(),
        revokedAt: (data.revokedAt as Date | null) ?? null,
      };
      this.consents.push(c);
      return c;
    },
  };

  pjosKundliRecord = {
    findUnique: async ({ where }: { where: { id: string } }) => this.kundli.find((k) => k.id === where.id) ?? null,
    findMany: async ({ where }: { where: { personId: string } }) =>
      this.kundli.filter((k) => k.personId === where.personId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    findFirst: async ({ where }: { where: { personId: string; snapshotHash: string } }) =>
      this.kundli.find((k) => k.personId === where.personId && k.snapshotHash === where.snapshotHash) ?? null,
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const k: PjosKundliRecordRow = {
        id: this.uid(),
        personId: data.personId as string,
        snapshotHash: data.snapshotHash as string,
        engineVersion: data.engineVersion as string,
        birthDate: data.birthDate as Date,
        birthTime: data.birthTime as string,
        birthPlace: (data.birthPlace as string | null) ?? null,
        birthLat: (data.birthLat as number | null) ?? null,
        birthLon: (data.birthLon as number | null) ?? null,
        timezone: (data.timezone as number | null) ?? null,
        timeConfidence: (data.timeConfidence as string) ?? 'EXACT',
        snapshotJson: data.snapshotJson as string,
        createdAt: new Date(),
      };
      this.kundli.push(k);
      return k;
    },
  };

  pjosPredictionRecord = {
    findMany: async ({ where, orderBy: _o }: { where: { kundliId?: string; personId?: string }; orderBy: { createdAt: 'asc' } }) =>
      this.predictions
        .filter((p) => (!where.kundliId || p.kundliId === where.kundliId) && (!where.personId || p.personId === where.personId))
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const p: PjosPredictionRecordRow = {
        id: this.uid(),
        contentId: data.contentId as string,
        personId: data.personId as string,
        kundliId: data.kundliId as string,
        statement: data.statement as string,
        evidenceNodeIds: data.evidenceNodeIds as string,
        status: data.status as string,
        confidence: data.confidence as number,
        basis: data.basis as string,
        prevHash: data.prevHash as string,
        hash: data.hash as string,
        createdAt: new Date(),
      };
      this.predictions.push(p);
      return p;
    },
  };
}

const BIRTH = {
  birthDate: '1989-06-15',
  birthTime: '06:30',
  latitude: 25.08,
  longitude: 87.44,
  timezone: 5.5,
  locationName: 'Munger, Bihar, India',
};

const OWNER: PjosActor = { accountId: 'acc-1', practitionerId: null, isProfessional: false, channel: 'SESSION' };
const STRANGER: PjosActor = { accountId: 'acc-2', practitionerId: null, isProfessional: false, channel: 'SESSION' };
const ANON: PjosActor = { accountId: null, practitionerId: null, isProfessional: false, channel: 'ANONYMOUS' };

test.describe('PJOS-01-DOMAIN slice 3: persistence boundary', () => {
  test('session: signed token round-trips; tamper and expiry are rejected', () => {
    const { token, expiresAt } = createPjosSessionToken('acc-1', 'PHONE_OTP');
    expect(verifyPjosSessionToken(token)).toEqual({ accountId: 'acc-1', authChannel: 'PHONE_OTP' });
    expect(expiresAt.getTime() > Date.now()).toBe(true);
    // Tampered payload
    const parts = token.split('.');
    const bad = Buffer.from(JSON.stringify({ sub: 'acc-2', iat: 0, exp: 9999999999, ch: 'PHONE_OTP' })).toString('base64url');
    expect(verifyPjosSessionToken(`${bad}.${parts[1]}`)).toBeNull();
    // Expired
    const expired = createPjosSessionToken('acc-1', 'PHONE_OTP', new Date(Date.now() - 8 * 24 * 3600 * 1000));
    expect(verifyPjosSessionToken(expired.token)).toBeNull();
  });

  test('kundli persistence: idempotent on (person, snapshotHash); new birth time = new versioned record', async () => {
    const db = new FakePjosDb();
    const snapshot = getCanonicalJyotishSnapshot(BIRTH);
    const r1 = await persistKundliRecord(db, { ...BIRTH, personId: 'p1' }, snapshot);
    const r2 = await persistKundliRecord(db, { ...BIRTH, personId: 'p1' }, getCanonicalJyotishSnapshot(BIRTH));
    expect(r2.id).toBe(r1.id); // idempotent
    expect(db.kundli.length).toBe(1);

    const r3 = await persistKundliRecord(db, { ...BIRTH, personId: 'p1', birthTime: '14:00' }, getCanonicalJyotishSnapshot({ ...BIRTH, birthTime: '14:00' }));
    expect(r3.id).not.toBe(r1.id);
    expect(r3.snapshotHash).not.toBe(r1.snapshotHash);
    expect(db.kundli.length).toBe(2); // versioned history, old record intact
  });

  test('evidence rebuilt from storage is deterministic (same node IDs as a fresh compile)', async () => {
    const db = new FakePjosDb();
    const snapshot = getCanonicalJyotishSnapshot(BIRTH);
    const record = await persistKundliRecord(db, { ...BIRTH, personId: 'p1' }, snapshot);
    const { store } = buildEvidenceForKundli(record);
    const fresh = compileEvidence(snapshot);
    const idsA = store.list().map((n) => n.id).sort();
    const idsB = fresh.store.list().map((n) => n.id).sort();
    expect(idsA).toEqual(idsB);
    expect(snapshotHash(snapshot)).toBe(record.snapshotHash);
  });

  test('prediction chain: append continues across calls; status derived; tamper detected', async () => {
    const db = new FakePjosDb();
    const snapshot = getCanonicalJyotishSnapshot(BIRTH);
    const record = await persistKundliRecord(db, { ...BIRTH, personId: 'p1' }, snapshot);
    const { store } = buildEvidenceForKundli(record);
    const moonNode = store.getBySubject('graha:Moon').find((n) => n.claim === 'placement')!;

    const p1 = await appendPredictionToKundli(db, record, store, {
      personRef: 'p1',
      statement: 'Moon is in Tula (Libra).',
      evidenceNodeIds: [moonNode.id],
      confidence: 0.9,
      basis: 'DERIVED_FROM_CALCULATION',
    });
    expect(p1.status).toBe('EVIDENCE_BACKED');
    expect(p1.prevHash).toBe('GENESIS');

    const p2 = await appendPredictionToKundli(db, record, store, {
      personRef: 'p1',
      statement: 'Cites a node that does not exist.',
      evidenceNodeIds: ['no-such-node'],
      confidence: 0.5,
      basis: 'DERIVED_FROM_CALCULATION',
    });
    expect(p2.status).toBe('INSUFFICIENT_CALCULATION_EVIDENCE');
    expect(p2.prevHash).toBe(p1.hash); // chain continues

    let chain = await verifyKundliPredictionChain(db, record.id, 'p1');
    expect(chain).toEqual({ verified: true, count: 2 });

    // Tamper: edit a stored statement — the chain must fail verification...
    const row1 = db.predictions.find((p) => p.contentId === p1.id)!; // PredictionRecord.id IS the content id
    (row1 as { statement: string }).statement = 'Moon is in Vrishabha (tampered).';
    chain = await verifyKundliPredictionChain(db, record.id, 'p1');
    expect(chain.verified).toBe(false);
    // ...and appends are refused while the chain is corrupted.
    await expect(
      appendPredictionToKundli(db, record, store, {
        personRef: 'p1',
        statement: 'Another one.',
        evidenceNodeIds: [moonNode.id],
        confidence: 0.9,
        basis: 'DERIVED_FROM_CALCULATION',
      })
    ).rejects.toThrow(/corrupted/);
  });

  test('repository over Prisma: guard decisions match the in-memory matrix', async () => {
    const db = new FakePjosDb();
    db.persons.push({ id: 'p1', displayName: 'Me', isMinor: false } as PjosPersonRecord);
    db.relationships.push({ id: 'r1', accountId: 'acc-1', personId: 'p1', relationType: 'SELF', guardianRole: null, isActive: true } as PjosRelationshipRecord);
    db.grants.push({
      id: 'g1',
      personId: 'p1',
      granteeAccountId: null,
      granteePractitionerId: 'prac-9',
      scope: 'CONSULT',
      sensitivity: 'CONSULTATION_CONFIDENTIAL',
      grantedAt: new Date('2026-01-01'),
      expiresAt: null,
      revokedAt: null,
      grantedById: null,
    } as PjosGrantRecord);
    const repo = new PrismaOwnershipRepository(db);
    const self = await repo.findRelationship('p1', 'acc-1');
    expect(self?.relationType).toBe('SELF');
    const grants = await repo.findGrantsForPerson('p1');
    expect(grants).toHaveLength(1);
    expect(await repo.countActiveConsents('p1', 'CONSULTATION_CONFIDENTIAL')).toBe(0);
    db.consents.push({ id: 'c1', personId: 'p1', accountId: 'acc-1', sensitivity: 'CONSULTATION_CONFIDENTIAL', status: 'GRANTED', purpose: 'x', version: 'v1', grantedAt: new Date(), revokedAt: null } as PjosConsentRecordRow);
    expect(await repo.countActiveConsents('p1', 'CONSULTATION_CONFIDENTIAL')).toBe(1);
  });

  test('routes: anonymous 401; owner flow works end-to-end; stranger 403 with zero data leak', async () => {
    const db = new FakePjosDb();

    // Anonymous
    expect((await handleListPersons(db, ANON)).status).toBe(401);

    // Owner creates a person + kundli
    const created = await handleCreatePerson(db, OWNER, { displayName: 'Me' });
    expect(created.status).toBe(201);
    const personId = (created.body.person as { id: string }).id;

    const list = await handleListPersons(db, OWNER);
    expect(list.status).toBe(200);
    expect((list.body.persons as unknown[]).map((p) => (p as { id: string }).id)).toContain(personId);

    const kundliRes = await handleCreateKundli(db, OWNER, { personId, ...BIRTH });
    expect(kundliRes.status).toBe(201);
    const kundliId = (kundliRes.body.kundli as { id: string }).id;
    expect((kundliRes.body.evidence as { nodeCount: number }).nodeCount).toBeGreaterThan(30);

    // Owner reads back with evidence
    const got = await handleGetKundli(db, OWNER, kundliId, { includeEvidence: true, domains: ['GRAHA', 'DASHA'] });
    expect(got.status).toBe(200);
    const ev = got.body.evidence as { nodes: { domain: string; subject: string; id: string }[] };
    for (const n of ev.nodes) expect(['GRAHA', 'DASHA']).toContain(n.domain);

    // Stranger: 403, and the body must not contain snapshot/person data
    const denied = await handleGetKundli(db, STRANGER, kundliId, { includeEvidence: true });
    expect(denied.status).toBe(403);
    expect(JSON.stringify(denied.body)).not.toContain('Munger');
    expect(JSON.stringify(denied.body)).not.toContain('snapshot');

    // Prediction round-trip through the route
    const moonNode = ev.nodes.find((n) => n.subject === 'graha:Moon');
    const moonId = moonNode?.id ?? ev.nodes[0].id;
    const predRes = await handleCreatePrediction(db, OWNER, kundliId, {
      statement: 'Moon is in Tula (Libra), 7th house.',
      evidenceNodeIds: [moonId],
      confidence: 0.9,
    });
    expect(predRes.status).toBe(201);
    expect((predRes.body.prediction as { status: string }).status).toBe('EVIDENCE_BACKED');
    expect((predRes.body.chain as { verified: boolean }).verified).toBe(true);

    const preds = await handleListPredictions(db, OWNER, kundliId);
    expect(preds.status).toBe(200);
    expect((preds.body.predictions as unknown[])).toHaveLength(1);
    expect((preds.body.chain as { verified: boolean; count: number })).toEqual({ verified: true, count: 1 });

    // Stranger cannot list the ledger
    const deniedList = await handleListPredictions(db, STRANGER, kundliId);
    expect(deniedList.status).toBe(403);
  });

  test('routes: professional without grant is 403; operator with matching grant can read', async () => {
    const db = new FakePjosDb();
    const person = await handleCreatePerson(db, OWNER, { displayName: 'Me' });
    const personId = (person.body.person as { id: string }).id;
    const kundliRes = await handleCreateKundli(db, OWNER, { personId, ...BIRTH });
    const kundliId = (kundliRes.body.kundli as { id: string }).id;

    const noGrant: PjosActor = { accountId: null, practitionerId: 'prac-x', isProfessional: true, channel: 'OPERATOR' };
    expect((await handleGetKundli(db, noGrant, kundliId, {})).status).toBe(403);

    db.grants.push({
      id: 'g1',
      personId,
      granteeAccountId: null,
      granteePractitionerId: 'prac-x',
      scope: 'READ',
      sensitivity: 'PERSONAL_ASTROLOGY',
      grantedAt: new Date('2026-01-01'),
      expiresAt: null,
      revokedAt: null,
      grantedById: null,
    } as PjosGrantRecord);
    const withGrant: PjosActor = { accountId: null, practitionerId: 'prac-x', isProfessional: true, channel: 'OPERATOR' };
    const ok = await handleGetKundli(db, withGrant, kundliId, {});
    expect(ok.status).toBe(200);

    // READ grant cannot append predictions
    const noWrite: PjosActor = { accountId: null, practitionerId: 'prac-x', isProfessional: true, channel: 'OPERATOR' };
    const writeDenied = await handleCreatePrediction(db, noWrite, kundliId, {
      statement: 'x',
      evidenceNodeIds: ['y'],
      confidence: 0.5,
    });
    expect(writeDenied.status).toBe(403);
  });

  test('routes: unknown kundli id is 404; bad birth inputs are 400 (after authz)', async () => {
    const db = new FakePjosDb();
    expect((await handleGetKundli(db, OWNER, 'nope', {})).status).toBe(404);
    // Ownership is checked BEFORE input validation — create the person so
    // the invalid-input path is actually reached.
    const person = await handleCreatePerson(db, OWNER, { displayName: 'Me' });
    const personId = (person.body.person as { id: string }).id;
    const bad = await handleCreateKundli(db, OWNER, { personId, birthDate: '15/06/1989', birthTime: '06:30', latitude: 25, longitude: 87, timezone: 5.5 });
    expect(bad.status).toBe(400);
  });
});
