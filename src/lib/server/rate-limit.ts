import { getRequestIP } from "@tanstack/react-start/server";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Logical name of the action being limited (e.g. "login"). */
  key: string;
  /** Max attempts allowed within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

/**
 * Simple fixed-window, in-memory rate limiter for auth endpoints. Sufficient for
 * a single-instance deployment; swap for a shared store (Redis/Supabase) when
 * scaling horizontally.
 */
export function enforceRateLimit({ key, limit, windowMs }: RateLimitOptions): void {
  const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const existing = buckets.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (existing.count >= limit) {
    throw new Error("Too many attempts. Please wait a moment and try again.");
  }

  existing.count += 1;
}
