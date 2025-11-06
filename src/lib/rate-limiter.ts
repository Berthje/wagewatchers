/**
 * Simple in-memory rate limiter for feedback submissions
 * Tracks submissions by IP address with a daily reset
 */

interface RateLimitEntry {
    count: number;
    resetAt: Date;
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

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    message?: string;
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

    // If the reset time has passed, reset the counter
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

    // Check if limit is exceeded
    if (entry.count >= limit) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: entry.resetAt,
            message:
                `Rate limit exceeded. You can submit ${limit} calls per day.`,
        };
    }

    // Increment the counter
    entry.count += 1;
    rateLimitStore.set(identifier, entry);

    return {
        allowed: true,
        remaining: limit - entry.count,
        resetAt: entry.resetAt,
    };
}

/**
 * Get the next day reset time (midnight UTC)
 */
function getNextDayReset(): Date {
    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0);
    return tomorrow;
}

/**
 * Extract IP address from request headers
 * Handles various proxy and load balancer headers
 */
export function getClientIP(headers: Headers): string {
    // Check common proxy headers in order of preference
    const forwardedFor = headers.get("x-forwarded-for");
    if (forwardedFor) {
        // x-forwarded-for can contain multiple IPs, take the first one
        return forwardedFor.split(",")[0].trim();
    }

    const realIP = headers.get("x-real-ip");
    if (realIP) {
        return realIP.trim();
    }

    const cfConnectingIP = headers.get("cf-connecting-ip"); // Cloudflare
    if (cfConnectingIP) {
        return cfConnectingIP.trim();
    }

    // Fallback to a default (should not happen in production)
    return "unknown";
}

/**
 * Get remaining submissions for an identifier
 */
function getRemainingSubmissions(
    identifier: string,
    limit: number = 5,
): { remaining: number; resetAt: Date | null } {
    const entry = rateLimitStore.get(identifier);

    if (!entry) {
        return {
            remaining: limit,
            resetAt: null,
        };
    }

    const now = new Date();
    if (entry.resetAt < now) {
        return {
            remaining: limit,
            resetAt: getNextDayReset(),
        };
    }

    return {
        remaining: Math.max(0, limit - entry.count),
        resetAt: entry.resetAt,
    };
}
