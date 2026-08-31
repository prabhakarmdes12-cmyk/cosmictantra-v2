import { PrismaClient } from '@prisma/client';

/**
 * Lazy Prisma client.
 *
 * Instantiation happens on FIRST USE, not at module scope. This keeps the
 * production build's page-data collection from constructing a database
 * client for routes that merely import this module, and avoids connecting
 * at import time (standard Next.js/Prisma practice). Runtime behaviour is
 * unchanged: the first `db.<model>` call constructs the singleton.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let cached: PrismaClient | undefined = globalForPrisma.prisma;

export function getDb(): PrismaClient {
  if (!cached) {
    cached = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = cached;
  }
  return cached;
}

export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_t, prop) {
    const client = getDb();
    const value = (client as unknown as Record<string, unknown>)[prop as string];
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  },
  set(_t, prop, value) {
    const client = getDb();
    (client as unknown as Record<string, unknown>)[prop as string] = value;
    return true;
  },
});
