import "server-only";

/**
 * Simple in-memory rate limiter for development.
 * In production, this should be replaced with a Redis-based solution.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configuration for different endpoint types.
 */
export const RATE_LIMIT_CONFIG = {
  // Auth endpoints - strict limits to prevent brute force
  auth: {
    requests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // Password reset - strict limits
  passwordReset: {
    requests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Email verification - moderate limits
  emailVerification: {
    requests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Search suggestions - higher limits for legitimate use
  searchSuggestions: {
    requests: 30,
    windowMs: 60 * 1000, // 1 minute
  },
  // Public IMEI checks - each miss hits a paid/rate-limited provider
  imeiCheck: {
    requests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  // Messaging - moderate limits to prevent spam
  messaging: {
    requests: 20,
    windowMs: 60 * 1000, // 1 minute
  },
  // Contact seller - moderate limits
  contactSeller: {
    requests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // General API - baseline limits
  general: {
    requests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

export type RateLimitType = keyof typeof RATE_LIMIT_CONFIG;

/**
 * Checks if a request should be rate limited based on identifier.
 * Returns true if the request is allowed, false if rate limited.
 */
export function checkRateLimit(
  identifier: string,
  type: RateLimitType = "general",
): { allowed: boolean; remaining: number; resetTime: number } {
  const config = RATE_LIMIT_CONFIG[type];
  const now = Date.now();
  
  // Get or create entry for this identifier
  let entry = rateLimitStore.get(identifier);
  
  // Reset if window has expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(identifier, entry);
  }
  
  // Check if limit exceeded
  if (entry.count >= config.requests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }
  
  // Increment counter
  entry.count++;
  rateLimitStore.set(identifier, entry);
  
  return {
    allowed: true,
    remaining: config.requests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Generates a rate limit identifier from request context.
 * Combines IP address and user ID if available.
 */
export function getRateLimitIdentifier(
  ipAddress: string | null | undefined,
  userId?: string,
): string {
  const parts = [];
  
  if (userId) {
    parts.push(`user:${userId}`);
  }
  
  if (ipAddress) {
    parts.push(`ip:${ipAddress}`);
  }
  
  return parts.join(":") || "unknown";
}

/**
 * Cleanup function to remove expired entries.
 * Should be called periodically to prevent memory leaks.
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}

/**
 * Rate limit error response helper.
 */
export class RateLimitError extends Error {
  constructor(
    message: string = "Too many requests. Please try again later.",
    public resetTime: number,
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}
