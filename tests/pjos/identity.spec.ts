/**
 * PJOS IDENTITY — anonymous-first, claim-on-value, and the merge path.
 *
 * The merge tests are the point of this file. A user who signs in by phone
 * today and by email next month must stay one human with one set of charts,
 * and that is exactly the property that is invisible in manual testing and
 * catastrophic once there is real data.
 */
import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { InMemoryIdentityStore } from '../../src/lib/pjos/identity/inMemoryIdentityStore';
import {
  IdentityService, IdentityError, IDENTITY_ERRORS, normaliseSubject,
  ANONYMOUS_SESSION_TTL_DAYS, CONSENT_PURPOSE_SELF_ASTROLOGY,
} from '../../src/lib/pjos/identity/identityService';

test.describe.configure({ mode: 'parallel' });

const T0 = new Date('2026-09-02T10:00:00.000Z');
const later = (ms: number) => new Date(T0.getTime() + ms);
const hash = (s: string) => createHash('sha256').update(s).digest('hex');

const BIRTH = {
  displayName: 'Test Subject',
  birthDate: new Date('1990-01-01T00:00:00.000Z'),
  birthTime: '06:45',
  birthPlace: 'Patna',
  birthLat: 25.5941,
  birthLon: 85.1376,
};

function setup() {
  const store = new InMemoryIdentityStore();
  return { store, svc: new IdentityService(store) };
}

/** Walks a visitor from cold to claimed. */
async function claimedUser(svc: IdentityService, token: string, subject: string, now = T0) {
  await svc.beginAnonymousSession(hash(token), now);
  await svc.recordBirthDetails(hash(token), BIRTH, now);
  return svc.claimSession({
    tokenHash: hash(token), channel: 'PHONE_OTP', subject, verified: true, now,
  });
}

/* ══════════════════ anonymous first ══════════════════ */

test.describe('the chart exists before the account does', () => {
  test('ID-01: birth details create a Person with no auth at all', async () => {
    const { store, svc } = setup();
    await svc.beginAnonymousSession(hash('t1'), T0);
    const person = await svc.recordBirthDetails(hash('t1'), BIRTH, T0);

    expect(person.id).toBeTruthy();
    expect(store.accounts.size, 'no account should be created yet').toBe(0);
    expect(store.consents, 'nothing to consent to before we ask for anything').toEqual([]);
  });

  test('ID-02: an abandoned funnel leaves a recoverable chart', async () => {
    const { svc } = setup();
    await svc.beginAnonymousSession(hash('t2'), T0);
    const first = await svc.recordBirthDetails(hash('t2'), BIRTH, T0);

    // Same device, next day. beginAnonymousSession must find, not replace.
    const session = await svc.beginAnonymousSession(hash('t2'), later(86_400_000));
    expect(session.personId).toBe(first.id);
  });

  test('ID-03: re-entering the same details does not litter orphan Persons', async () => {
    const { store, svc } = setup();
    await svc.beginAnonymousSession(hash('t3'), T0);
    const a = await svc.recordBirthDetails(hash('t3'), BIRTH, T0);
    const b = await svc.recordBirthDetails(hash('t3'), { ...BIRTH }, T0);
    expect(b.id).toBe(a.id);
    expect(store.persons.size).toBe(1);
  });

  test('ID-04: correcting the birth time replaces the chart rather than adding one', async () => {
    const { store, svc } = setup();
    await svc.beginAnonymousSession(hash('t4'), T0);
    await svc.recordBirthDetails(hash('t4'), BIRTH, T0);
    const fixed = await svc.recordBirthDetails(hash('t4'), { ...BIRTH, birthTime: '07:15' }, T0);
    expect(store.persons.size).toBe(1);
    expect([...store.persons.values()][0].id).toBe(fixed.id);
  });

  test('ID-05: an expired session is refused, not silently renewed', async () => {
    const { svc } = setup();
    await svc.beginAnonymousSession(hash('t5'), T0, 1);
    await expect(svc.recordBirthDetails(hash('t5'), BIRTH, later(2 * 86_400_000)))
      .rejects.toThrow(IDENTITY_ERRORS.SESSION_EXPIRED);
  });

  test('ID-06: the raw cookie value is never persisted', async () => {
    const { store, svc } = setup();
    await svc.beginAnonymousSession(hash('super-secret-token'), T0);
    const dump = JSON.stringify([...store.sessions.values()]);
    expect(dump).not.toContain('super-secret-token');
    expect(dump).toContain(hash('super-secret-token'));
  });
});

/* ══════════════════ claim on value ══════════════════ */

test.describe('claiming attaches the chart without retyping it', () => {
  test('ID-07: a first claim creates the account, the link and the consent', async () => {
    const { store, svc } = setup();
    const res = await claimedUser(svc, 't7', '+91 98765 43210');

    expect(res.accountCreated).toBe(true);
    expect(store.accounts.size).toBe(1);
    const rels = await store.listRelationships(res.accountId);
    expect(rels.map((r) => r.relationType)).toEqual(['SELF']);
    expect(rels[0].personId).toBe(res.personId);
    expect(store.consents).toHaveLength(1);
    expect(store.consents[0].purpose).toBe(CONSENT_PURPOSE_SELF_ASTROLOGY);
  });

  test('ID-08: claiming twice is idempotent — no second person, no second consent', async () => {
    const { store, svc } = setup();
    const first = await claimedUser(svc, 't8', '+919876543210');
    const again = await svc.claimSession({
      tokenHash: hash('t8'), channel: 'PHONE_OTP', subject: '+919876543210',
      verified: true, now: later(1000),
    });

    expect(again.alreadyClaimed).toBe(true);
    expect(again.accountId).toBe(first.accountId);
    expect(again.personId).toBe(first.personId);
    expect(store.consents, 'consent is append-only, not append-repeatedly').toHaveLength(1);
    expect(store.persons.size).toBe(1);
  });

  test('ID-09: a returning user on a new device lands on the SAME account', async () => {
    const { store, svc } = setup();
    const first = await claimedUser(svc, 'device-a', '+919876543210');
    const second = await claimedUser(svc, 'device-b', '+91 98765 43210', later(90_000));

    expect(second.accountId).toBe(first.accountId);
    expect(second.accountCreated).toBe(false);
    expect(store.accounts.size, 'one human, one account').toBe(1);
  });

  test('ID-10: the same chart on two devices stays ONE Person', async () => {
    const { store, svc } = setup();
    const first = await claimedUser(svc, 'device-a', '+919876543210');
    const second = await claimedUser(svc, 'device-b', '+919876543210', later(90_000));

    expect(second.deduplicated).toBe(true);
    expect(second.personId).toBe(first.personId);
    expect(store.persons.size, 'one human, one Person').toBe(1);
    const rels = await store.listRelationships(first.accountId);
    expect(rels).toHaveLength(1);
  });

  test('ID-11: a different chart on the same account is kept, not collapsed', async () => {
    const { store, svc } = setup();
    const mine = await claimedUser(svc, 'device-a', '+919876543210');

    await svc.beginAnonymousSession(hash('device-c'), later(1000));
    await svc.recordBirthDetails(hash('device-c'),
      { ...BIRTH, displayName: 'Spouse', birthDate: new Date('1992-04-04T00:00:00.000Z') }, later(1000));
    const other = await svc.claimSession({
      tokenHash: hash('device-c'), channel: 'PHONE_OTP', subject: '+919876543210',
      verified: true, now: later(1000),
    });

    expect(other.deduplicated).toBe(false);
    expect(other.personId).not.toBe(mine.personId);
    expect(store.persons.size).toBe(2);
  });

  test('ID-12: an unverified credential may not attach to somebody else’s account', async () => {
    const { svc } = setup();
    await claimedUser(svc, 'victim', '+919876543210');

    await svc.beginAnonymousSession(hash('attacker'), later(1000));
    await svc.recordBirthDetails(hash('attacker'), BIRTH, later(1000));
    await expect(svc.claimSession({
      tokenHash: hash('attacker'), channel: 'PHONE_OTP', subject: '+919876543210',
      verified: false, now: later(1000),
    })).rejects.toThrow(IDENTITY_ERRORS.UNVERIFIED_CHANNEL);
  });

  test('ID-13: claiming an empty session is refused', async () => {
    const { svc } = setup();
    await svc.beginAnonymousSession(hash('t13'), T0);
    await expect(svc.claimSession({
      tokenHash: hash('t13'), channel: 'EMAIL', subject: 'a@b.com', verified: true, now: T0,
    })).rejects.toThrow(IDENTITY_ERRORS.SESSION_EMPTY);
  });
});

/* ══════════════════ the merge path ══════════════════ */

test.describe('one human, many ways to sign in', () => {
  test('ID-14: THE BUG — phone then email must not become two humans', async () => {
    const { store, svc } = setup();

    // Monday: signs in with a phone number and generates a chart.
    const phone = await claimedUser(svc, 'mon', '+919876543210');

    // Tuesday: different device, signs in with email. Two accounts now exist,
    // which is exactly the state the old schema could never recover from.
    await svc.beginAnonymousSession(hash('tue'), later(86_400_000));
    await svc.recordBirthDetails(hash('tue'),
      { ...BIRTH, displayName: 'Second Chart' }, later(86_400_000));
    const email = await svc.claimSession({
      tokenHash: hash('tue'), channel: 'EMAIL', subject: 'User@Example.COM',
      verified: true, now: later(86_400_000),
    });
    expect(email.accountId).not.toBe(phone.accountId);
    expect(store.accounts.size).toBe(2);

    // Wednesday: adds the email to the phone account. This is the moment that
    // used to be impossible.
    const link = await svc.linkChannel({
      accountId: phone.accountId, channel: 'EMAIL', subject: 'user@example.com',
      verified: true, now: later(2 * 86_400_000),
    });

    expect(link.merged, 'linking must detect and merge, not fork').toBeTruthy();
    const survivor = link.merged!.survivingAccountId;

    // Both charts survive, on one account.
    const rels = await store.listRelationships(survivor);
    expect(rels.map((r) => r.personId).sort())
      .toEqual([phone.personId, email.personId].sort());

    // Both credentials now open the same door.
    for (const [channel, subject] of [['PHONE_OTP', '+919876543210'], ['EMAIL', 'user@example.com']] as const) {
      const found = await store.findIdentity(channel, subject);
      expect(found?.accountId, `${channel} must resolve to the survivor`).toBe(survivor);
    }
  });

  test('ID-15: the older account survives, whichever way round it is called', async () => {
    const a = setup();
    const older = await claimedUser(a.svc, 'x1', '+911111111111', T0);
    await a.svc.beginAnonymousSession(hash('x2'), later(60_000));
    await a.svc.recordBirthDetails(hash('x2'), BIRTH, later(60_000));
    const newer = await a.svc.claimSession({
      tokenHash: hash('x2'), channel: 'EMAIL', subject: 'z@z.com', verified: true, now: later(60_000),
    });

    const link = await a.svc.linkChannel({
      accountId: newer.accountId, channel: 'PHONE_OTP', subject: '+911111111111',
      verified: true, now: later(120_000),
    });
    expect(link.merged!.survivingAccountId, 'the account with the longest history wins')
      .toBe(older.accountId);
  });

  test('ID-16: merging is idempotent', async () => {
    const { store, svc } = setup();
    const phone = await claimedUser(svc, 'm1', '+912222222222');
    await svc.beginAnonymousSession(hash('m2'), later(1000));
    await svc.recordBirthDetails(hash('m2'), { ...BIRTH, displayName: 'Other' }, later(1000));
    await svc.claimSession({
      tokenHash: hash('m2'), channel: 'EMAIL', subject: 'dup@x.com', verified: true, now: later(1000),
    });

    const first = await svc.linkChannel({
      accountId: phone.accountId, channel: 'EMAIL', subject: 'dup@x.com', verified: true, now: later(2000),
    });
    const second = await svc.linkChannel({
      accountId: phone.accountId, channel: 'EMAIL', subject: 'dup@x.com', verified: true, now: later(3000),
    });

    expect(second.alreadyLinked).toBe(true);
    expect(second.merged).toBeUndefined();
    expect(store.merges, 'a second merge must not be recorded').toHaveLength(1);
    expect(first.merged!.survivingAccountId).toBe(second.accountId);
  });

  test('ID-17: reads follow a merge chain A -> B -> C', async () => {
    const { svc, store } = setup();
    const a = await claimedUser(svc, 'c1', '+913333333333', T0);
    await svc.beginAnonymousSession(hash('c2'), later(10_000));
    await svc.recordBirthDetails(hash('c2'), { ...BIRTH, displayName: 'B' }, later(10_000));
    const b = await svc.claimSession({
      tokenHash: hash('c2'), channel: 'EMAIL', subject: 'b@x.com', verified: true, now: later(10_000),
    });
    await svc.beginAnonymousSession(hash('c3'), later(20_000));
    await svc.recordBirthDetails(hash('c3'), { ...BIRTH, displayName: 'C' }, later(20_000));
    const c = await svc.claimSession({
      tokenHash: hash('c3'), channel: 'GOOGLE', subject: 'google-sub-1', verified: true, now: later(20_000),
    });

    // c into b, then b into a. a is oldest so it survives both.
    await svc.linkChannel({ accountId: b.accountId, channel: 'GOOGLE', subject: 'google-sub-1', verified: true, now: later(30_000) });
    await svc.linkChannel({ accountId: a.accountId, channel: 'EMAIL', subject: 'b@x.com', verified: true, now: later(40_000) });

    for (const start of [a.accountId, b.accountId, c.accountId]) {
      const resolved = await svc.resolveAccount(start);
      expect(resolved.id, `${start} must resolve to the survivor`).toBe(a.accountId);
    }
    const rels = await store.listRelationships(a.accountId);
    expect(rels, 'no chart may be lost in a chain of merges').toHaveLength(3);
  });

  test('ID-18: a merge cycle is reported, not looped over', async () => {
    const { store, svc } = setup();
    const a = await store.createAccount({ displayName: null, now: T0 });
    const b = await store.createAccount({ displayName: null, now: T0 });
    await store.markAccountMerged(a.id, b.id);
    await store.markAccountMerged(b.id, a.id);
    await expect(svc.resolveAccount(a.id)).rejects.toThrow(IDENTITY_ERRORS.MERGE_CYCLE);
  });

  test('ID-19: merging requires a verified channel', async () => {
    const { svc } = setup();
    const phone = await claimedUser(svc, 'v1', '+914444444444');
    await svc.beginAnonymousSession(hash('v2'), later(1000));
    await svc.recordBirthDetails(hash('v2'), { ...BIRTH, displayName: 'Other' }, later(1000));
    await svc.claimSession({
      tokenHash: hash('v2'), channel: 'EMAIL', subject: 'other@x.com', verified: true, now: later(1000),
    });

    await expect(svc.linkChannel({
      accountId: phone.accountId, channel: 'EMAIL', subject: 'other@x.com',
      verified: false, now: later(2000),
    })).rejects.toThrow(IDENTITY_ERRORS.UNVERIFIED_CHANNEL);
  });

  test('ID-20: a merge never deletes the absorbed account, and is audited', async () => {
    const { store, svc } = setup();
    const phone = await claimedUser(svc, 'a1', '+915555555555');
    await svc.beginAnonymousSession(hash('a2'), later(1000));
    await svc.recordBirthDetails(hash('a2'), { ...BIRTH, displayName: 'Other' }, later(1000));
    const email = await svc.claimSession({
      tokenHash: hash('a2'), channel: 'EMAIL', subject: 'audit@x.com', verified: true, now: later(1000),
    });
    await svc.linkChannel({
      accountId: phone.accountId, channel: 'EMAIL', subject: 'audit@x.com', verified: true, now: later(2000),
    });

    const absorbed = await store.getAccount(email.accountId);
    expect(absorbed, 'the absorbed account is retained for audit').toBeTruthy();
    expect(absorbed!.isActive).toBe(false);
    expect(absorbed!.mergedIntoId).toBe(phone.accountId);

    expect(store.merges).toHaveLength(1);
    expect(store.merges[0]).toMatchObject({
      survivingAccountId: phone.accountId,
      absorbedAccountId: email.accountId,
      reason: 'LINK_CHANNEL:EMAIL',
    });
  });

  test('ID-21: consent records stay with the account that actually consented', async () => {
    // Rewriting whose consent it was, to tidy up a merge, would falsify the
    // DPDP record. The merge audit row is how the two are related instead.
    const { store, svc } = setup();
    const phone = await claimedUser(svc, 'k1', '+916666666666');
    await svc.beginAnonymousSession(hash('k2'), later(1000));
    await svc.recordBirthDetails(hash('k2'), { ...BIRTH, displayName: 'Other' }, later(1000));
    const email = await svc.claimSession({
      tokenHash: hash('k2'), channel: 'EMAIL', subject: 'consent@x.com', verified: true, now: later(1000),
    });
    await svc.linkChannel({
      accountId: phone.accountId, channel: 'EMAIL', subject: 'consent@x.com', verified: true, now: later(2000),
    });

    expect(store.consents).toHaveLength(2);
    expect(store.consents.map((c) => c.accountId).sort())
      .toEqual([phone.accountId, email.accountId].sort());
  });

  test('ID-22: linking a brand-new channel does not trigger a merge', async () => {
    const { store, svc } = setup();
    const phone = await claimedUser(svc, 'n1', '+917777777777');
    const link = await svc.linkChannel({
      accountId: phone.accountId, channel: 'EMAIL', subject: 'fresh@x.com', verified: true, now: later(1000),
    });
    expect(link.merged).toBeUndefined();
    expect(link.alreadyLinked).toBe(false);
    expect(store.merges).toHaveLength(0);
    expect(await store.listIdentities(phone.accountId)).toHaveLength(2);
  });

  test('ID-23: linking onto an already-absorbed account still lands on the survivor', async () => {
    const { svc } = setup();
    const a = await claimedUser(svc, 's1', '+918888888888', T0);
    await svc.beginAnonymousSession(hash('s2'), later(10_000));
    await svc.recordBirthDetails(hash('s2'), { ...BIRTH, displayName: 'B' }, later(10_000));
    const b = await svc.claimSession({
      tokenHash: hash('s2'), channel: 'EMAIL', subject: 'stale@x.com', verified: true, now: later(10_000),
    });
    await svc.linkChannel({ accountId: a.accountId, channel: 'EMAIL', subject: 'stale@x.com', verified: true, now: later(20_000) });

    // A stale reference to the absorbed account must not resurrect it.
    const link = await svc.linkChannel({
      accountId: b.accountId, channel: 'GOOGLE', subject: 'g-1', verified: true, now: later(30_000),
    });
    expect(link.accountId).toBe(a.accountId);
  });
});

/* ══════════════════ subject normalisation ══════════════════ */

test.describe('two spellings of one credential are one credential', () => {
  test('ID-24: phone numbers normalise to digits with an optional +', () => {
    const forms = ['+91 98765 43210', '+91-98765-43210', '+91 (98765) 43210', '+919876543210'];
    const all = new Set(forms.map((f) => normaliseSubject('PHONE_OTP', f)));
    expect([...all]).toEqual(['+919876543210']);
  });

  test('ID-25: email case and padding are ignored', () => {
    expect(normaliseSubject('EMAIL', '  User@Example.COM ')).toBe('user@example.com');
  });

  test('ID-26: provider subjects are opaque and stay case-sensitive', () => {
    expect(normaliseSubject('GOOGLE', 'AbC123')).toBe('AbC123');
    expect(normaliseSubject('GOOGLE', 'abc123')).toBe('abc123');
  });

  test('ID-27: nonsense is rejected at the boundary, not stored', () => {
    for (const bad of ['', '   ', 'not-a-phone']) {
      expect(() => normaliseSubject('PHONE_OTP', bad)).toThrow(IdentityError);
    }
    for (const bad of ['', 'nope', 'a@b']) {
      expect(() => normaliseSubject('EMAIL', bad)).toThrow(IdentityError);
    }
  });

  test('ID-28: normalisation is applied on the read path too', async () => {
    // Normalising only on write leaves lookups able to miss, which forks the
    // user just as effectively as having no merge at all.
    const { store, svc } = setup();
    const first = await claimedUser(svc, 'q1', '+919999999999');
    const second = await claimedUser(svc, 'q2', '+91 99999 99999', later(1000));
    expect(second.accountId).toBe(first.accountId);
    expect(store.accounts.size).toBe(1);
  });
});

test('ID-29: the default session lifetime is stated, not accidental', () => {
  expect(ANONYMOUS_SESSION_TTL_DAYS).toBe(30);
});
