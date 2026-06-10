// lib/rateLimit.ts
// In-memory rate limiter for API routes (works on Vercel Edge/Node)

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (resets on cold start — fine for serverless)
const store = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs?: number;  // Time window in ms (default: 60_000 = 1 min)
  max?: number;       // Max requests per window (default: 20)
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
}

/**
 * Check rate limit for a given identifier (IP, userId, etc.)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = {}
): RateLimitResult {
  const { windowMs = 60_000, max = 20 } = config;
  const now = Date.now();

  // Cleanup expired entries periodically
  if (Math.random() < 0.01) {
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  }

  const entry = store.get(identifier);

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return {
      success: true,
      remaining: max - 1,
      resetAt: now + windowMs,
      retryAfterMs: 0,
    };
  }

  if (entry.count >= max) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterMs: entry.resetAt - now,
    };
  }

  entry.count++;
  return {
    success: true,
    remaining: max - entry.count,
    resetAt: entry.resetAt,
    retryAfterMs: 0,
  };
}

/**
 * Get rate limit headers for API response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    ...(result.retryAfterMs > 0
      ? { "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)) }
      : {}),
  };
}

/**
 * Get client identifier from Next.js request headers
 */
export function getClientId(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "anonymous"
  );
      }
