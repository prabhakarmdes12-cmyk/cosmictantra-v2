/**
 * PJOS IDENTITY SERVICE — anonymous-first, claim-on-value, merge-safe.
 *
 * THE FUNNEL THIS EXISTS FOR
 * --------------------------
 * Asking for a phone number before showing the Kundli is the biggest drop-off
 * in this product. So:
 *
 *   1. A visitor types birth details. A `PjosPerson` is created immediately
 *      and held against a signed device cookie. No auth, no friction, and an
 *      abandoned funnel still leaves a recoverable chart.
 *   2. At the first moment of real value — download, save, send to WhatsApp,
 *      pay — we ask for a phone or an email and CLAIM the session. Nothing is
 *      retyped. The user experiences "it remembered me", never "please
 *      register".
 *
 * THE MERGE PROBLEM, AND WHY IT IS FIXED HERE AND NOT LATER
 * --------------------------------------------------------
 * The original schema hung `authChannel + authSubject` directly on
 * `PjosAccount` under a composite unique. That makes a phone login and an
 * email login two different accounts for one human, each holding its own copy
 * of the same Person, with no way back. It is invisible until you have real
 * users and then it is a data-repair project.
 *
 * Credentials now live in `PjosAuthIdentity`, unique on (channel, subject)
 * GLOBALLY. That single constraint is what turns "two accounts for one human"
 * from a silent fork into a detectable event, because a subject can only ever
 * point at one account. When linking a channel finds it already attached
 * elsewhere, we merge instead of forking.
 *
 * WHAT A MERGE MOVES, AND WHAT IT REFUSES TO MOVE
 * ----------------------------------------------
 * Moved: auth identities, person relationships (de-duplicated by person), and
 * the "granted by" origin of access grants. These are mutable associations.
 *
 * NOT moved: `PjosConsentRecord`. A consent is a historical fact about who
 * agreed to what, when. Rewriting whose consent it was in order to tidy up a
 * merge would be falsifying a DPDP record. The absorbed account is kept
 * (never deleted) with `mergedIntoId` set, and `PjosAccountMerge` is the
 * append-only audit row that lets a reader walk from the old account to the
 * survivor.
 *
 * ONE PERSON PER HUMAN
 * --------------------
 * `claimSession` de-duplicates. If the account already holds a SELF person
 * with the same birth details, the session's freshly created Person is
 * discarded and the session is pointed at the canonical one. Otherwise a user
 * who generates their own chart on a phone and again on a laptop ends up as
 * two people inside one account, which is the same bug one level down.
 */
import type { PjosAuthChannel, PjosSensitivity } from '../../jyotish/pjosTypes';
import type {
  AccountRow, AnonymousSessionRow, BirthDetailsInput, IdentityRepository, PersonRow,
} from './types';

export const IDENTITY_SERVICE_VERSION = 'pjos-identity-v1';

/** Default life of an unclaimed chart. Long enough to come back tomorrow. */
export const ANONYMOUS_SESSION_TTL_DAYS = 30;

export const CONSENT_PURPOSE_SELF_ASTROLOGY = 'SELF_ASTROLOGY_PROFILE';
export const CONSENT_VERSION = 'v1-dpdp-2023';

export const IDENTITY_ERRORS = {
  SESSION_NOT_FOUND: 'PJOS_SESSION_NOT_FOUND',
  SESSION_EXPIRED: 'PJOS_SESSION_EXPIRED',
  SESSION_EMPTY: 'PJOS_SESSION_HAS_NO_PERSON',
  UNVERIFIED_CHANNEL: 'PJOS_UNVERIFIED_CHANNEL_CANNOT_MERGE',
  INVALID_SUBJECT: 'PJOS_INVALID_AUTH_SUBJECT',
  ACCOUNT_NOT_FOUND: 'PJOS_ACCOUNT_NOT_FOUND',
  MERGE_CYCLE: 'PJOS_ACCOUNT_MERGE_CYCLE',
} as const;

export class IdentityError extends Error {
  /**
   * The message always carries the code. A log line reading "not a phone
   * number: 12" is far less useful at 3am than one that names the invariant
   * that was broken, and callers matching on the code get a stable handle.
   */
  constructor(readonly code: string, detail?: string) {
    super(detail ? `${code}: ${detail}` : code);
    this.name = 'IdentityError';
  }
}

/**
 * Canonical form of an auth subject.
 *
 * Two spellings of one phone number must not become two accounts, so this
 * runs before every lookup AND every write — normalising only on write leaves
 * the reads able to miss.
 */
export function normaliseSubject(channel: PjosAuthChannel, raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) throw new IdentityError(IDENTITY_ERRORS.INVALID_SUBJECT, 'empty subject');

  if (channel === 'PHONE_OTP') {
    // Keep a leading +, drop every other non-digit: "+91 98765-43210",
    // "+919876543210" and "+91 (98765) 43210" are one person.
    const digits = trimmed.replace(/(?!^\+)[^\d]/g, '');
    if (!/^\+?\d{6,15}$/.test(digits)) {
      throw new IdentityError(IDENTITY_ERRORS.INVALID_SUBJECT, `not a phone number: ${raw}`);
    }
    return digits;
  }
  if (channel === 'EMAIL') {
    const lower = trimmed.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lower)) {
      throw new IdentityError(IDENTITY_ERRORS.INVALID_SUBJECT, `not an email: ${raw}`);
    }
    return lower;
  }
  // Provider subject ids are opaque and case-sensitive.
  return trimmed;
}

/** Two people are the same person if their birth moment and place match. */
function sameBirth(a: PersonRow, b: BirthDetailsInput | PersonRow): boolean {
  const t = (d: Date | null | undefined) => (d ? d.getTime() : null);
  const round = (n: number | null | undefined) => (typeof n === 'number' ? Math.round(n * 1e4) : null);
  return a.displayName.trim().toLowerCase() === (b.displayName ?? '').trim().toLowerCase()
    && t(a.birthDate) === t(b.birthDate ?? null)
    && (a.birthTime ?? null) === (b.birthTime ?? null)
    && round(a.birthLat) === round(b.birthLat ?? null)
    && round(a.birthLon) === round(b.birthLon ?? null);
}

export interface MergeSummary {
  survivingAccountId: string;
  absorbedAccountId: string;
  personsMoved: number;
  identitiesMoved: number;
}

export interface ClaimResult {
  accountId: string;
  personId: string;
  /** True when this claim created the account rather than finding it. */
  accountCreated: boolean;
  /** True when the session had already been claimed by this account. */
  alreadyClaimed: boolean;
  /** Set when the session's person duplicated one the account already held. */
  deduplicated: boolean;
}

export interface LinkResult {
  accountId: string;
  /** Present when linking discovered the channel on another account. */
  merged?: MergeSummary;
  /** True when the channel was already on this account. */
  alreadyLinked: boolean;
}

export class IdentityService {
  constructor(private readonly repo: IdentityRepository) {}

  /* ------------------------------------------------------------------ */
  /* Step 1 — before anyone signs in                                     */
  /* ------------------------------------------------------------------ */

  /**
   * Starts a device-scoped session. `tokenHash` is the SHA-256 of the cookie
   * value; the raw token never reaches persistence, so a database leak does
   * not hand out live sessions.
   */
  async beginAnonymousSession(tokenHash: string, now = new Date(),
    ttlDays = ANONYMOUS_SESSION_TTL_DAYS): Promise<AnonymousSessionRow> {
    const existing = await this.repo.findSessionByTokenHash(tokenHash);
    if (existing) return existing;
    const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);
    return this.repo.createSession({ tokenHash, now, expiresAt });
  }

  /**
   * Records birth details against the session. This is the moment a
   * `PjosPerson` comes into existence — no account, no consent prompt, no
   * interruption.
   */
  async recordBirthDetails(tokenHash: string, details: BirthDetailsInput,
    now = new Date()): Promise<PersonRow> {
    const session = await this.requireLiveSession(tokenHash, now);

    // Re-entering details on the same device updates the chart in place
    // instead of littering orphan Persons.
    if (session.personId) {
      const current = await this.repo.getPerson(session.personId);
      if (current && sameBirth(current, details)) return current;
      if (current) await this.repo.deletePerson(current.id);
    }

    const person = await this.repo.createPerson(details);
    await this.repo.attachPersonToSession(session.id, person.id);
    return person;
  }

  /* ------------------------------------------------------------------ */
  /* Step 2 — the first moment of real value                             */
  /* ------------------------------------------------------------------ */

  /**
   * Attaches the anonymous chart to a real account, creating the account if
   * this credential has never been seen.
   *
   * `verified` must be true for a channel that has actually been proven (OTP
   * confirmed, OAuth callback validated). An unverified claim may still
   * create a brand-new account, but it may never attach to an existing one —
   * otherwise typing a stranger's phone number would hand you their charts.
   */
  async claimSession(input: {
    tokenHash: string;
    channel: PjosAuthChannel;
    subject: string;
    verified: boolean;
    displayName?: string | null;
    sensitivity?: PjosSensitivity;
    now?: Date;
  }): Promise<ClaimResult> {
    const now = input.now ?? new Date();
    const subject = normaliseSubject(input.channel, input.subject);
    const session = await this.requireLiveSession(input.tokenHash, now);
    if (!session.personId) throw new IdentityError(IDENTITY_ERRORS.SESSION_EMPTY);

    const existingIdentity = await this.repo.findIdentity(input.channel, subject);

    if (existingIdentity && !input.verified) {
      // The credential belongs to somebody. Proving it is the price of entry.
      throw new IdentityError(
        IDENTITY_ERRORS.UNVERIFIED_CHANNEL,
        'this credential already exists; verify it before claiming',
      );
    }

    let accountCreated = false;
    let account: AccountRow;
    if (existingIdentity) {
      account = await this.resolveAccount(existingIdentity.accountId);
    } else {
      account = await this.repo.createAccount({ displayName: input.displayName ?? null, now });
      await this.repo.createIdentity({
        accountId: account.id,
        channel: input.channel,
        subject,
        verifiedAt: input.verified ? now : null,
        now,
      });
      accountCreated = true;
    }

    // Idempotency: re-claiming the same session with the same credential is a
    // no-op, not a second person and not a second consent record.
    if (session.claimedByAccountId === account.id && session.personId) {
      return {
        accountId: account.id,
        personId: session.personId,
        accountCreated: false,
        alreadyClaimed: true,
        deduplicated: false,
      };
    }

    const { personId, deduplicated } = await this.attachPerson(account.id, session.personId);

    await this.repo.recordConsent({
      personId,
      accountId: account.id,
      sensitivity: input.sensitivity ?? 'PERSONAL_ASTROLOGY',
      purpose: CONSENT_PURPOSE_SELF_ASTROLOGY,
      version: CONSENT_VERSION,
      now,
    });
    await this.repo.markSessionClaimed(session.id, account.id, now);
    if (deduplicated) await this.repo.attachPersonToSession(session.id, personId);

    return { accountId: account.id, personId, accountCreated, alreadyClaimed: false, deduplicated };
  }

  /* ------------------------------------------------------------------ */
  /* Step 3 — a second way to sign in, without becoming a second human   */
  /* ------------------------------------------------------------------ */

  /**
   * Adds a credential to an account, merging if it already belongs elsewhere.
   *
   * This is the method that did not exist, and its absence is what would have
   * turned one user into two.
   */
  async linkChannel(input: {
    accountId: string;
    channel: PjosAuthChannel;
    subject: string;
    verified: boolean;
    now?: Date;
  }): Promise<LinkResult> {
    const now = input.now ?? new Date();
    const subject = normaliseSubject(input.channel, input.subject);
    const account = await this.resolveAccount(input.accountId);

    const existing = await this.repo.findIdentity(input.channel, subject);

    if (!existing) {
      await this.repo.createIdentity({
        accountId: account.id, channel: input.channel, subject,
        verifiedAt: input.verified ? now : null, now,
      });
      return { accountId: account.id, alreadyLinked: false };
    }

    const owner = await this.resolveAccount(existing.accountId);
    if (owner.id === account.id) return { accountId: account.id, alreadyLinked: true };

    // Two accounts, one human. Merging silently on an unproven credential
    // would let anyone absorb an account by typing its email.
    if (!input.verified) {
      throw new IdentityError(
        IDENTITY_ERRORS.UNVERIFIED_CHANNEL,
        'merging two accounts requires a verified channel',
      );
    }

    const merged = await this.mergeAccounts(account, owner, `LINK_CHANNEL:${input.channel}`, now);
    return { accountId: merged.survivingAccountId, merged, alreadyLinked: false };
  }

  /**
   * Folds `b` into `a` (or the reverse — see below) and returns what moved.
   *
   * Survivor selection is deterministic and does not depend on which side the
   * caller passed: the older account wins, ties broken by id. Two concurrent
   * merges of the same pair therefore agree on the outcome instead of
   * pointing at each other.
   */
  async mergeAccounts(a: AccountRow, b: AccountRow, reason: string,
    now = new Date()): Promise<MergeSummary> {
    const [surviving, absorbed] = this.pickSurvivor(a, b);

    const identitiesMoved = await this.repo.reassignIdentities(absorbed.id, surviving.id);
    const personsMoved = await this.repo.reassignRelationships(absorbed.id, surviving.id);
    await this.repo.reassignGrantOrigin(absorbed.id, surviving.id);
    await this.repo.markAccountMerged(absorbed.id, surviving.id);
    await this.repo.recordMerge({
      survivingAccountId: surviving.id,
      absorbedAccountId: absorbed.id,
      reason,
      personsMoved,
      identitiesMoved,
      mergedAt: now,
    });

    return {
      survivingAccountId: surviving.id,
      absorbedAccountId: absorbed.id,
      personsMoved,
      identitiesMoved,
    };
  }

  /**
   * Follows `mergedIntoId` to the account that is actually live.
   *
   * Merges chain — A absorbed into B, later B into C — and every read has to
   * land on C. The hop limit is not paranoia: a cycle here would hang a
   * request thread, so it fails loudly instead.
   */
  async resolveAccount(accountId: string, maxHops = 16): Promise<AccountRow> {
    let current = await this.repo.getAccount(accountId);
    if (!current) throw new IdentityError(IDENTITY_ERRORS.ACCOUNT_NOT_FOUND, accountId);
    const seen = new Set<string>([current.id]);
    let hops = 0;
    while (current.mergedIntoId) {
      if (hops >= maxHops || seen.has(current.mergedIntoId)) {
        throw new IdentityError(IDENTITY_ERRORS.MERGE_CYCLE, `from ${accountId}`);
      }
      seen.add(current.mergedIntoId);
      const next = await this.repo.getAccount(current.mergedIntoId);
      if (!next) throw new IdentityError(IDENTITY_ERRORS.ACCOUNT_NOT_FOUND, current.mergedIntoId);
      current = next;
      hops += 1;
    }
    return current;
  }

  /* ------------------------------------------------------------------ */

  private pickSurvivor(a: AccountRow, b: AccountRow): [AccountRow, AccountRow] {
    if (a.createdAt.getTime() !== b.createdAt.getTime()) {
      return a.createdAt.getTime() < b.createdAt.getTime() ? [a, b] : [b, a];
    }
    return a.id <= b.id ? [a, b] : [b, a];
  }

  /** Links a person to an account, collapsing an exact duplicate if present. */
  private async attachPerson(accountId: string, personId: string):
  Promise<{ personId: string; deduplicated: boolean }> {
    const candidate = await this.repo.getPerson(personId);
    if (candidate) {
      const held = await this.repo.listRelationships(accountId);
      for (const rel of held) {
        if (!rel.isActive || rel.relationType !== 'SELF') continue;
        const existing = await this.repo.getPerson(rel.personId);
        if (existing && existing.id !== candidate.id && sameBirth(existing, candidate)) {
          await this.repo.deletePerson(candidate.id);
          return { personId: existing.id, deduplicated: true };
        }
      }
    }

    const already = await this.repo.findRelationship(accountId, personId);
    if (!already) {
      await this.repo.createRelationship({ accountId, personId, relationType: 'SELF' });
    }
    return { personId, deduplicated: false };
  }

  private async requireLiveSession(tokenHash: string, now: Date): Promise<AnonymousSessionRow> {
    const session = await this.repo.findSessionByTokenHash(tokenHash);
    if (!session) throw new IdentityError(IDENTITY_ERRORS.SESSION_NOT_FOUND);
    if (session.expiresAt.getTime() <= now.getTime()) {
      throw new IdentityError(IDENTITY_ERRORS.SESSION_EXPIRED);
    }
    return session;
  }
}
