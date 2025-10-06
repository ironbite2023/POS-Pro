/**
 * Simple in-memory rate limiter
 * For production, use Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store rate limit data in memory
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for a given identifier (IP address, user ID, etc.)
 * @param identifier - Unique identifier for rate limiting (e.g., IP address)
 * @param maxRequests - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 */
export const checkRateLimit = (
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes default
): RateLimitResult => {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // First request or expired window
  if (!entry || entry.resetTime < now) {
    const resetTime = now + windowMs;
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime,
    });

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: resetTime,
    };
  }

  // Within rate limit window
  if (entry.count < maxRequests) {
    entry.count += 1;
    rateLimitStore.set(identifier, entry);

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - entry.count,
      reset: entry.resetTime,
    };
  }

  // Rate limit exceeded
  return {
    success: false,
    limit: maxRequests,
    remaining: 0,
    reset: entry.resetTime,
  };
};

/**
 * Get client IP address from request headers
 */
export const getClientIp = (request: Request): string => {
  // Try various headers that might contain the real IP
  const headers = new Headers(request.headers);
  
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback
  return 'unknown';
};

/**
 * Create rate limit headers for response
 */
export const createRateLimitHeaders = (result: RateLimitResult): Record<string, string> => {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  };
};
