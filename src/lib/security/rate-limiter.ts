"use server";

interface RateLimitResult {
  success: boolean;
  remaining: number;
}

// ---------------------------------------------------------------------------
// In-memory fallback rate limiter
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

async function inMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  cleanupExpiredEntries();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count < limit) {
    entry.count += 1;
    return { success: true, remaining: limit - entry.count };
  }

  return { success: false, remaining: 0 };
}

// ---------------------------------------------------------------------------
// Upstash-backed rate limiter (used when env vars are configured)
// ---------------------------------------------------------------------------

async function upstashRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const { Ratelimit } = await import("@upstash/ratelimit");
  const { Redis } = await import("@upstash/redis");

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(limit, `${windowMs} ms`),
    prefix: "gundamaxing:rl",
  });

  const result = await ratelimit.limit(key);

  return {
    success: result.success,
    remaining: result.remaining,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether a request identified by `key` is within the allowed rate limit.
 *
 * Uses Upstash Redis when `UPSTASH_REDIS_REST_URL` is set, otherwise falls
 * back to an in-memory Map-based implementation.
 *
 * @param key       - Unique identifier for the rate-limited entity (e.g. IP or user ID).
 * @param limit     - Maximum number of allowed requests within the window.
 * @param windowMs  - Length of the rate-limit window in milliseconds.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (process.env.UPSTASH_REDIS_REST_URL) {
    return upstashRateLimit(key, limit, windowMs);
  }

  return inMemoryRateLimit(key, limit, windowMs);
}
