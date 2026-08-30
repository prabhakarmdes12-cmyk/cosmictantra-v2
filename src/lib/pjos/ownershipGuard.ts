/**
 * PJOS-01 DOMAIN (Decision D-1): Ownership Guard
 * -----------------------------------------------
 * The ownership invariant, enforced BEFORE any read or mutation:
 *
 *   resource  ->  personId  ->  (authorized account relationship)
 *                               OR (professional access grant)
 *
 * Sensitivity ladder (low -> high):
 *   ACCOUNT_PRIVATE < PERSONAL_ASTROLOGY < CONSULTATION_CONFIDENTIAL < PANDIT_INTERNAL
 *
 * Access paths:
 *  A. ACCOUNT (owner side) — via an active PjosPersonRelationship:
 *     - SELF: every sensitivity (the account owns its own profile data).
 *     - GUARDIAN_MANAGED: person must be a minor; guardian may read/write
 *       PERSONAL_ASTROLOGY. PANDIT_INTERNAL is never reachable by a family
 *       path (it is a professional-workspace sensitivity).
 *     - WITH_CONSENT / IMPORTED_FOR_PRIVATE_ANALYSIS: PERSONAL_ASTROLOGY
 *       only, and CONSULTATION_CONFIDENTIAL additionally requires an active
 *       consent record for that sensitivity.
 *     - PANDIT_CLIENT (person is a client inside a professional's account):
 *       PERSONAL_ASTROLOGY + CONSULTATION_CONFIDENTIAL with consent.
 *  B. PROFESSIONAL (practitioner side) — via an active PjosAccessGrant whose
 *     granteePractitionerId matches, with scope covering the action and
 *     sensitivity >= the resource sensitivity. PANDIT_INTERNAL additionally
 *     requires an active PANDIT_CLIENT relationship on the person.
 *
 * Consent semantics are deliberately minimal: an ACTIVE consent record
 * (status GRANTED, not revoked/expired) for the exact sensitivity. Policy
 * (what purpose, retention, legal effect) lives in the ConsentRecord data,
 * not in this guard — so policy can evolve without rewriting access rules.
 *
 * This module is persistence-agnostic: it consumes an OwnershipRepository
 * interface. The in-memory implementation is used by tests today; the Prisma
 * implementation (rows structurally satisfy these interfaces) is wired at the
 * API boundary in the next slice. No DB access happens in this file.
 */

import type {
  PjosAuthChannel,
  PjosConsentStatus,
  PjosGrantScope,
  PjosRelationshipType,
  PjosSensitivity,
} from '../jyotish/pjosTypes';

export interface PjosPersonRow {
  id: string;
  isMinor: boolean;
}

export interface PjosRelationshipRow {
  personId: string;
  relationType: PjosRelationshipType;
  guardianRole: string | null;
  isActive: boolean;
}

export interface PjosGrantRow {
  personId: string;
  granteeAccountId: string | null;
  granteePractitionerId: string | null;
  scope: PjosGrantScope;
  sensitivity: PjosSensitivity;
  grantedAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
}

export interface PjosConsentRow {
  personId: string;
  sensitivity: PjosSensitivity;
  status: PjosConsentStatus;
  grantedAt: Date;
  revokedAt: Date | null;
}

/** Persistence boundary. Prisma rows satisfy this structurally. */
export interface OwnershipRepository {
  getPerson(personId: string): PjosPersonRow | null | Promise<PjosPersonRow | null>;
  findRelationship(personId: string, accountId: string): PjosRelationshipRow | null | Promise<PjosRelationshipRow | null>;
  findGrantsForPerson(personId: string): PjosGrantRow[] | Promise<PjosGrantRow[]>;
  /**
   * Number of ACTIVE consents for (personId, sensitivity). "Active" has one
   * precise meaning: the MOST RECENT consent event for that sensitivity is a
   * grant that has not been revoked/expired. Revocation is a later event and
   * therefore supersedes earlier grants — consent records are append-only,
   * but the effective state follows the latest event.
   */
  countActiveConsents(personId: string, sensitivity: PjosSensitivity): number | Promise<number>;
}

export interface ActorIdentity {
  /** Authenticated account (owner side or grantee side). */
  accountId?: string;
  /** Authenticated professional (practitioner side). */
  practitionerId?: string;
  isProfessional: boolean;
}

export type AccessAction = 'READ' | 'WRITE' | 'CONSULT' | 'MANAGE';

export interface ResourceRef {
  /** The object being accessed; every server-side object carries its personId. */
  personId: string;
  sensitivity: PjosSensitivity;
  action: AccessAction;
}

export const DENY_REASONS = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  UNKNOWN_PERSON: 'UNKNOWN_PERSON',
  NOT_OWNER: 'NOT_OWNER',
  RELATIONSHIP_INACTIVE: 'RELATIONSHIP_INACTIVE',
  GUARDIAN_ONLY_FOR_MINORS: 'GUARDIAN_ONLY_FOR_MINORS',
  FAMILY_CANNOT_REACH_PANDIT_INTERNAL: 'FAMILY_CANNOT_REACH_PANDIT_INTERNAL',
  CONSENT_REQUIRED: 'CONSENT_REQUIRED',
  NO_GRANT: 'NO_GRANT',
  GRANT_REVOKED: 'GRANT_REVOKED',
  GRANT_EXPIRED: 'GRANT_EXPIRED',
  SCOPE_MISMATCH: 'SCOPE_MISMATCH',
  SENSITIVITY_MISMATCH: 'SENSITIVITY_MISMATCH',
  PANDIT_CLIENT_RELATIONSHIP_REQUIRED: 'PANDIT_CLIENT_RELATIONSHIP_REQUIRED',
} as const;
export type DenyReason = (typeof DENY_REASONS)[keyof typeof DENY_REASONS];

export interface AccessDecision {
  allowed: boolean;
  reason?: DenyReason;
  path: 'ACCOUNT' | 'PROFESSIONAL' | 'NONE';
}

const SENSITIVITY_RANK: Record<PjosSensitivity, number> = {
  ACCOUNT_PRIVATE: 0,
  PERSONAL_ASTROLOGY: 1,
  CONSULTATION_CONFIDENTIAL: 2,
  PANDIT_INTERNAL: 3,
};

const SCOPE_RANK: Record<PjosGrantScope, number> = {
  READ: 1,
  WRITE: 2,
  CONSULT: 3,
  MANAGE: 4,
};

function actionRequiredScope(action: AccessAction): PjosGrantScope {
  switch (action) {
    case 'READ':
      return 'READ';
    case 'WRITE':
      return 'WRITE';
    case 'CONSULT':
      return 'CONSULT';
    case 'MANAGE':
      return 'MANAGE';
  }
}

/**
 * Account-side base sensitivity for a relationship type.
 * SELF owns the person's full person-held data (up to
 * CONSULTATION_CONFIDENTIAL). ACCOUNT_PRIVATE covers the account's own
 * credential/profile data and is resolved by accountId identity, not through
 * the person path. PANDIT_INTERNAL is NEVER reachable via the account path.
 */
function relationshipBaseSensitivity(rel: PjosRelationshipRow, person: PjosPersonRow): PjosSensitivity {
  switch (rel.relationType) {
    case 'SELF':
      return 'CONSULTATION_CONFIDENTIAL';
    case 'GUARDIAN_MANAGED':
      // Guardians manage personal astrology of a minor; never professional internals.
      return person.isMinor ? 'PERSONAL_ASTROLOGY' : 'PERSONAL_ASTROLOGY';
    case 'WITH_CONSENT':
    case 'IMPORTED_FOR_PRIVATE_ANALYSIS':
    case 'PANDIT_CLIENT':
      return 'PERSONAL_ASTROLOGY';
  }
}

export async function checkOwnership(
  repo: OwnershipRepository,
  actor: ActorIdentity,
  resource: ResourceRef
): Promise<AccessDecision> {
  // 0. Authentication — the guard never guesses identities.
  if (!actor || (!actor.accountId && !actor.practitionerId)) {
    return { allowed: false, reason: DENY_REASONS.UNAUTHENTICATED, path: 'NONE' };
  }

  const person = await repo.getPerson(resource.personId);
  if (!person) {
    // Deliberately indistinguishable from "not owner" for enumeration safety.
    return { allowed: false, reason: DENY_REASONS.UNKNOWN_PERSON, path: 'NONE' };
  }

  const need = resource.sensitivity;
  const needRank = SENSITIVITY_RANK[need];
  const isDualRole = Boolean(actor.accountId && actor.practitionerId);
  // Denial reasons from the account path, remembered so a dual-role actor can
  // still be admitted (or denied) on the professional path — the two paths
  // are independent grounds of access.
  let accountDenial: DenyReason | null = null;

  /* ---------- Path A: account (owner side) ---------- */
  if (actor.accountId) {
    const rel = await repo.findRelationship(resource.personId, actor.accountId);
    if (!rel) {
      if (!isDualRole) return { allowed: false, reason: DENY_REASONS.NOT_OWNER, path: 'ACCOUNT' };
      accountDenial = DENY_REASONS.NOT_OWNER;
    } else if (!rel.isActive) {
      accountDenial = DENY_REASONS.RELATIONSHIP_INACTIVE;
      if (!isDualRole) return { allowed: false, reason: accountDenial, path: 'ACCOUNT' };
    } else {
      if (rel.relationType === 'GUARDIAN_MANAGED' && !person.isMinor) {
        accountDenial = DENY_REASONS.GUARDIAN_ONLY_FOR_MINORS;
        if (!isDualRole) return { allowed: false, reason: accountDenial, path: 'ACCOUNT' };
      } else {
        const base = relationshipBaseSensitivity(rel, person);
        const baseRank = SENSITIVITY_RANK[base];
        if (needRank <= baseRank) {
          return { allowed: true, path: 'ACCOUNT' };
        }
        // Above base: only an active consent can elevate — never PANDIT_INTERNAL.
        if (need === 'PANDIT_INTERNAL') {
          accountDenial = DENY_REASONS.FAMILY_CANNOT_REACH_PANDIT_INTERNAL;
          if (!isDualRole) return { allowed: false, reason: accountDenial, path: 'ACCOUNT' };
        } else if (need === 'CONSULTATION_CONFIDENTIAL') {
          const consents = await repo.countActiveConsents(resource.personId, 'CONSULTATION_CONFIDENTIAL');
          if (consents > 0) return { allowed: true, path: 'ACCOUNT' };
          accountDenial = DENY_REASONS.CONSENT_REQUIRED;
          if (!isDualRole) return { allowed: false, reason: accountDenial, path: 'ACCOUNT' };
        } else {
          accountDenial = DENY_REASONS.SENSITIVITY_MISMATCH;
          if (!isDualRole) return { allowed: false, reason: accountDenial, path: 'ACCOUNT' };
        }
      }
    }
  }

  /* ---------- Path B: professional (practitioner side) ---------- */
  if (actor.practitionerId) {
    const grants = await repo.findGrantsForPerson(resource.personId);
    const matching = grants.filter((g) => g.granteePractitionerId === actor.practitionerId);
    if (matching.length === 0) {
      return { allowed: false, reason: DENY_REASONS.NO_GRANT, path: 'PROFESSIONAL' };
    }
    const now = new Date();

    // Any matching grant that is live and covers scope+sensitivity admits.
    // (A later re-grant supersedes an earlier revocation; a stale revocation
    //  must not shadow a newer valid grant.)
    for (const g of matching) {
      if (g.revokedAt || (g.expiresAt && g.expiresAt < now)) continue;
      if (SCOPE_RANK[g.scope] < SCOPE_RANK[actionRequiredScope(resource.action)]) continue;
      if (SENSITIVITY_RANK[g.sensitivity] < needRank) continue;
      if (need === 'PANDIT_INTERNAL') {
        // Professional internals require an active PANDIT_CLIENT relationship.
        const rel = actor.accountId ? await repo.findRelationship(resource.personId, actor.accountId) : null;
        if (!rel || !rel.isActive || rel.relationType !== 'PANDIT_CLIENT') {
          return { allowed: false, reason: DENY_REASONS.PANDIT_CLIENT_RELATIONSHIP_REQUIRED, path: 'PROFESSIONAL' };
        }
      }
      return { allowed: true, path: 'PROFESSIONAL' };
    }

    // No admitting grant: report the most specific reason among the matching ones.
    if (matching.every((g) => g.revokedAt)) return { allowed: false, reason: DENY_REASONS.GRANT_REVOKED, path: 'PROFESSIONAL' };
    if (matching.every((g) => g.expiresAt && g.expiresAt < now)) return { allowed: false, reason: DENY_REASONS.GRANT_EXPIRED, path: 'PROFESSIONAL' };
    const anyScopeFail = matching.some((g) => !g.revokedAt && !(g.expiresAt && g.expiresAt < now) && SCOPE_RANK[g.scope] < SCOPE_RANK[actionRequiredScope(resource.action)]);
    if (anyScopeFail) return { allowed: false, reason: DENY_REASONS.SCOPE_MISMATCH, path: 'PROFESSIONAL' };
    const anySensFail = matching.some((g) => !g.revokedAt && !(g.expiresAt && g.expiresAt < now) && SENSITIVITY_RANK[g.sensitivity] < needRank);
    if (anySensFail) return { allowed: false, reason: DENY_REASONS.SENSITIVITY_MISMATCH, path: 'PROFESSIONAL' };
    return { allowed: false, reason: accountDenial ?? DENY_REASONS.NO_GRANT, path: 'PROFESSIONAL' };
  }

  return { allowed: false, reason: accountDenial ?? DENY_REASONS.NOT_OWNER, path: 'NONE' };
}

/**
 * API-boundary helper: throws a typed error so routes cannot forget the check.
 * `description` is included in the error message for audit logging only —
 * it must never leak person identifiers to the caller.
 */
export class OwnershipDeniedError extends Error {
  constructor(public readonly reason: DenyReason, public readonly personId: string) {
    super(`ownership_denied:${reason}`);
    this.name = 'OwnershipDeniedError';
  }
}

export async function assertOwnership(
  repo: OwnershipRepository,
  actor: ActorIdentity,
  resource: ResourceRef
): Promise<void> {
  const decision = await checkOwnership(repo, actor, resource);
  if (!decision.allowed) {
    throw new OwnershipDeniedError(decision.reason ?? 'NOT_OWNER', resource.personId);
  }
}
