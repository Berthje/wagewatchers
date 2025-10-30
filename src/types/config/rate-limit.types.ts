/**
 * Rate Limiting Types
 * Types for rate limiting functionality
 */

export interface RateLimitEntry {
    count: number;
    resetAt: Date;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    message?: string;
}
