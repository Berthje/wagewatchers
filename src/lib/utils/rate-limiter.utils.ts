/**
 * Rate Limiter Utility
 * In-memory rate limiting for feedback submissions
 */

interface RateLimitEntry {
    count: number;
    resetAt: Date;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    message?: string;
}

// In-memory store for rate limiting
// In production, consider using Redis or a database for persistence
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every hour to prevent memory leaks
setInterval(() => {
    const now = new Date();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetAt < now) {
            rateLimitStore.delete(key);
        }
    }
}, 60 * 60 * 1000); // 1 hour

/**
 * Get the next day reset time (midnight UTC)
 */
function getNextDayReset(): Date {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(now.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP address)
 * @param limit - Maximum number of requests allowed per day (default: 5)
 * @returns RateLimitResult with allowed status and remaining count
 */
export function checkRateLimit(
    identifier: string,
    limit: number = 5,
): RateLimitResult {
    const now = new Date();
    const entry = rateLimitStore.get(identifier);

    // If no entry exists, create a new one
    if (!entry) {
        const resetAt = getNextDayReset();
        rateLimitStore.set(identifier, {
            count: 1,
            resetAt,
        });
        return {
            allowed: true,
            remaining: limit - 1,
            resetAt,
        };
    }

    // If entry exists but reset time has passed, reset the counter
    if (entry.resetAt < now) {
        const resetAt = getNextDayReset();
        rateLimitStore.set(identifier, {
            count: 1,
            resetAt,
        });
        return {
            allowed: true,
            remaining: limit - 1,
            resetAt,
        };
    }

    // If under limit, increment and allow
    if (entry.count < limit) {
        entry.count++;
        rateLimitStore.set(identifier, entry);
        return {
            allowed: true,
            remaining: limit - entry.count,
            resetAt: entry.resetAt,
        };
    }

    // Over limit
    return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
        message: `Rate limit exceeded. Try again after ${entry.resetAt.toLocaleString()}`,
    };
}

/**
 * Get remaining requests for an identifier
 */
export function getRemainingRequests(
    identifier: string,
    limit: number = 5,
): number {
    const entry = rateLimitStore.get(identifier);
    if (!entry) return limit;

    const now = new Date();
    if (entry.resetAt < now) return limit;

    return Math.max(0, limit - entry.count);
}

/**
 * Reset rate limit for an identifier (useful for testing)
 */
export function resetRateLimit(identifier: string): void {
    rateLimitStore.delete(identifier);
}

/**
 * Extract client IP from request headers
 */
export function getClientIp(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const cfConnecting = request.headers.get("cf-connecting-ip");

    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }

    if (realIp) {
        return realIp;
    }

    if (cfConnecting) {
        return cfConnecting;
    }

    // Fallback (should not happen in production)
    return "unknown";
}
