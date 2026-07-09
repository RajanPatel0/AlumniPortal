/**
 * Edge-compatible in-process rate limiter.
 * Uses a sliding-window counter stored in a module-level Map.
 * Works in Next.js middleware / Edge runtime (no native Node APIs).
 *
 * Usage:
 *   const limiter = rateLimit({ interval: 60_000, max: 5 });
 *   const { success } = await limiter.check(ip);
 */

interface RateLimitStore {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitStore>();

// Periodically prune expired keys to avoid memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 60_000);
}

export function rateLimit({ interval, max }: { interval: number; max: number }) {
  return {
    check(key: string): { success: boolean; remaining: number; resetAt: number } {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || entry.resetAt < now) {
        // First request or window expired — reset
        const newEntry: RateLimitStore = { count: 1, resetAt: now + interval };
        store.set(key, newEntry);
        return { success: true, remaining: max - 1, resetAt: newEntry.resetAt };
      }

      entry.count += 1;
      if (entry.count > max) {
        return { success: false, remaining: 0, resetAt: entry.resetAt };
      }

      return { success: true, remaining: max - entry.count, resetAt: entry.resetAt };
    },
  };
}

// Pre-configured limiters for each endpoint
export const loginLimiter = rateLimit({ interval: 60_000, max: 8 });       // 8 attempts / minute
export const otpLimiter   = rateLimit({ interval: 10 * 60_000, max: 5 });  // 5 attempts / 10 minutes
export const registerLimiter = rateLimit({ interval: 60_000, max: 5 });    // 5 attempts / minute
