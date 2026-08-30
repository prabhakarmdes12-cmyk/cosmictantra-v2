/**
 * PJOS-01 DOMAIN: the single place that connects the PJOS layer to the real
 * Prisma client. Next.js route files import getPjosDb from HERE (never from
 * prismaRepository), which keeps the repository/persistence modules free of
 * engine side-effects at import time (unit tests inject an in-memory PjosDb).
 *
 * BRIDGE NOTE: the checked-in generated Prisma client predates the PJOS-01
 * models; after `prisma generate` in the deployment environment the real
 * client structurally satisfies PjosDb. Until the PJOS tables exist, routes
 * respond 503 (see pjosTablesAvailable) rather than leaking an opaque 500.
 */

import { db } from '../db';
import type { PjosDb } from './prismaRepository';

let cached: PjosDb | null = null;
export function getPjosDb(): PjosDb {
  if (!cached) cached = db as unknown as PjosDb;
  return cached;
}
