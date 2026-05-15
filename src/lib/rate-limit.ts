// Simple in-memory rate limiter. Per-instance only (Vercel serverless cold starts
// reset state) — adequate to stop casual abuse but NOT a DoS shield.
// For production-grade limiting, swap to Upstash Redis or Vercel KV.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    const fresh = { count: 1, resetAt: now + windowMs };
    buckets.set(key, fresh);
    return { ok: true, remaining: limit - 1, resetAt: fresh.resetAt };
  }
  b.count += 1;
  if (b.count > limit) {
    return { ok: false, remaining: 0, resetAt: b.resetAt };
  }
  return { ok: true, remaining: limit - b.count, resetAt: b.resetAt };
}

export function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}

// Garbage-collect expired buckets every ~5 min worth of calls
let gcCounter = 0;
export function maybeGc() {
  if (++gcCounter < 100) return;
  gcCounter = 0;
  const now = Date.now();
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}
