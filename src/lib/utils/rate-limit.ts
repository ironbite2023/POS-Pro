/**
 * Enhanced rate limiter with production-ready features
 * Structured for easy Redis migration in production environments
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  violations: number; // Track consecutive violations for progressive limiting
  lastViolation: number; // Timestamp of last violation
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipOnSuccess?: boolean;
  skipFailedRequests?: boolean;
  progressivePenalty?: boolean; // Enable progressive rate limiting
  bypassRoles?: string[]; // User roles that bypass rate limiting
}

// Store rate limit data in memory (Redis-ready structure)
const rateLimitStore = new Map<string, RateLimitEntry>();
const suspiciousIPs = new Set<string>(); // Track suspicious IP addresses

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Enhanced rate limiting with progressive penalties and security features
 * @param identifier - Unique identifier for rate limiting (e.g., IP address)
 * @param config - Rate limiting configuration or simple maxRequests number
 * @param windowMs - Time window in milliseconds (used if config is number)
 */
export const checkRateLimit = (
  identifier: string,
  config: RateLimitConfig | number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes default
): RateLimitResult => {
  const now = Date.now();
  
  // Handle legacy number parameter
  const rateLimitConfig: RateLimitConfig = typeof config === 'number' 
    ? { maxRequests: config, windowMs }
    : config;

  const entry = rateLimitStore.get(identifier);

  // Check if IP is suspicious
  const isSuspicious = suspiciousIPs.has(identifier);
  const suspiciousPenalty = isSuspicious ? 0.5 : 1; // 50% reduction for suspicious IPs

  // Calculate actual limits with progressive penalties
  let effectiveMaxRequests = Math.floor(rateLimitConfig.maxRequests * suspiciousPenalty);
  
  if (entry && rateLimitConfig.progressivePenalty) {
    // Apply progressive penalty based on violations
    const penaltyFactor = Math.max(0.1, 1 - (entry.violations * 0.2));
    effectiveMaxRequests = Math.floor(effectiveMaxRequests * penaltyFactor);
  }

  // First request or expired window
  if (!entry || entry.resetTime < now) {
    const resetTime = now + rateLimitConfig.windowMs;
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime,
      violations: entry?.violations || 0,
      lastViolation: entry?.lastViolation || 0,
    });

    return {
      success: true,
      limit: effectiveMaxRequests,
      remaining: effectiveMaxRequests - 1,
      reset: resetTime,
    };
  }

  // Within rate limit window
  if (entry.count < effectiveMaxRequests) {
    entry.count += 1;
    rateLimitStore.set(identifier, entry);

    return {
      success: true,
      limit: effectiveMaxRequests,
      remaining: effectiveMaxRequests - entry.count,
      reset: entry.resetTime,
    };
  }

  // Rate limit exceeded - record violation
  entry.violations += 1;
  entry.lastViolation = now;
  rateLimitStore.set(identifier, entry);

  // Mark as suspicious if too many violations
  if (entry.violations >= 5) {
    suspiciousIPs.add(identifier);
    console.warn(`[Security] IP ${identifier} marked as suspicious after ${entry.violations} violations`);
  }

  return {
    success: false,
    limit: effectiveMaxRequests,
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
