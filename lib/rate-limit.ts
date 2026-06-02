// In-memory rate limiter. Works for single-instance dev; swap for Upstash/Redis in production.
// TODO: replace with https://github.com/upstash/ratelimit before going to prod — this Map resets on every serverless cold start.
const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}
