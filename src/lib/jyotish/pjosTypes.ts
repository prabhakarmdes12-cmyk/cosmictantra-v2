/**
 * PJOS-01 DOMAIN (Decision D-1): shared identity/access types.
 *
 * These string-literal types mirror the Prisma enums in
 * prisma/schema.prisma (PjosAuthChannel, PjosSensitivity,
 * PjosRelationshipType, PjosGrantScope, PjosConsentStatus) so that
 * TypeScript code can be written and tested before the Prisma client is
 * regenerated in an environment where the engine download is available.
 * Prisma rows satisfy these structurally — no import from @prisma/client
 * is required (or desired, at this layer).
 */

export type PjosAuthChannel = 'PHONE_OTP' | 'EMAIL' | 'GOOGLE';

/** Sensitivity ladder, low -> high. */
export type PjosSensitivity =
  | 'ACCOUNT_PRIVATE'
  | 'PERSONAL_ASTROLOGY'
  | 'CONSULTATION_CONFIDENTIAL'
  | 'PANDIT_INTERNAL';

export type PjosRelationshipType =
  | 'SELF'
  | 'GUARDIAN_MANAGED'
  | 'WITH_CONSENT'
  | 'IMPORTED_FOR_PRIVATE_ANALYSIS'
  | 'PANDIT_CLIENT';

export type PjosGrantScope = 'READ' | 'WRITE' | 'CONSULT' | 'MANAGE';

export type PjosConsentStatus = 'GRANTED' | 'REVOKED' | 'EXPIRED';
