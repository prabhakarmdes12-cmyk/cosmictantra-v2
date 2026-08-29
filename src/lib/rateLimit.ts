import { NextResponse } from 'next/server';

/**
 * Lightweight in-memory fixed-window rate limiter.
 *
 * SCOPE NOTE (PJOS-01 follow-up): in-memory state is per-server-instance.
 * For multi-instance deployments this must be backed by a shared store
 * (Redis / DB). Until then it still bounds single-node abuse, which is
 * the threat class relevant to the current single-instance deployment.
 */

interface Bucket {
  count: number;
  windowStart: number;
}

export interface RateLimiterOptions {
  limit: number;
  windowMs: number;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const { limit, windowMs } = options;
  const buckets = new Map<string, Bucket>();

  // Opportunistic cleanup so the map cannot grow unbounded.
  let lastCleanup = Date.now();

  const cleanup = () => {
    const now = Date.now();
    if (now - lastCleanup < 60_000) return;
    lastCleanup = now;
    for (const [key, bucket] of buckets) {
      if (now - bucket.windowStart > windowMs) buckets.delete(key);
    }
  };

  /**
   * Returns null when the request is allowed, or a 429 NextResponse when
   * the per-key budget for the current window is exhausted.
   */
  function check(key: string): NextResponse | null {
    const now = Date.now();
    cleanup();
    const bucket = buckets.get(key);
    if (!bucket || now - bucket.windowStart > windowMs) {
      buckets.set(key, { count: 1, windowStart: now });
      return null;
    }
    bucket.count += 1;
    if (bucket.count > limit) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    return null;
  }

  return { check };
}

/**
 * Extracts a best-effort stable client key from a request (IP, then
 * fallback header). Never logs the raw value.
 */
export function clientKeyFor(req: { headers: { get(name: string): string | null } }): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
