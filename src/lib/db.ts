// Prisma lazy loader — resilient to missing generated client (sandbox network block)
// We avoid top-level import of '@prisma/client' that would fail at build-time when client not generated.
// Instead, we dynamically require it only at first use and degrade gracefully.

type PrismaClientLike = any;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientLike | undefined;
};

let cached: PrismaClientLike | undefined = globalForPrisma.prisma;
let clientLoadAttempted = false;
let clientAvailable: boolean | null = null;

function loadPrismaClient(): PrismaClientLike | null {
  if (clientLoadAttempted && clientAvailable === false) return null;
  if (cached) return cached;
  if (clientLoadAttempted) return null;
  clientLoadAttempted = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@prisma/client');
    const PrismaClient = mod.PrismaClient;
    if (!PrismaClient) {
      clientAvailable = false;
      return null;
    }
    cached = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = cached;
    clientAvailable = true;
    return cached;
  } catch (e) {
    // Module not found or engine missing — degrade to null, repo will fallback to memory
    // eslint-disable-next-line no-console
    console.warn('[db] PrismaClient not available, degrading to memory fallback:', (e as any)?.message || e);
    clientAvailable = false;
    return null;
  }
}

export function getDb(): PrismaClientLike {
  const c = loadPrismaClient();
  if (!c) {
    // Return a proxy that throws on use but allows build to succeed
    // Callers in repo.ts already handle null via isDbConfigured / getDb returning null
    // but this ensures top-level `db` import doesn't explode at build
    throw new Error('Prisma client not available — using degraded memory mode');
  }
  return c;
}

// Export `db` as a lazy proxy that only instantiates on first property access.
// If client not available, proxy operations will throw but repo.ts uses dynamic import('@/lib/db') with fallback so it won't crash build.
export const db: PrismaClientLike = new Proxy({} as PrismaClientLike, {
  get(_t, prop) {
    const client = loadPrismaClient();
    if (!client) {
      // Return no-op async functions that will be caught as DB failure in repo
      if (prop === '$queryRawUnsafe' || prop === '$executeRawUnsafe' || prop === '$queryRaw' || prop === '$executeRaw' || String(prop).startsWith('$')) {
        return async () => {
          throw new Error('Prisma client not available — degraded');
        };
      }
      return undefined;
    }
    const value = (client as unknown as Record<string, unknown>)[prop as string];
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  },
  set(_t, prop, value) {
    const client = loadPrismaClient();
    if (!client) return true;
    (client as unknown as Record<string, unknown>)[prop as string] = value;
    return true;
  },
});
