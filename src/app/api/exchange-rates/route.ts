import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exchangeRates } from "@/lib/db/schema";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiter";

// Cache rates for 1 hour to avoid frequent DB queries
export const revalidate = 3600;
export const dynamic = 'force-dynamic';

/**
 * GET endpoint to retrieve current exchange rates
 * Used by the frontend to get live rates
 * Rate limited to 2 requests per day per IP
 */
export async function GET(request: Request) {
    try {
        // Rate limiting: 2 requests per day per IP (exchange rates don't change often)
        const clientIP = getClientIP(request.headers);
        const rateLimit = checkRateLimit(`${clientIP}:exchange-rates`, 2);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    error: "Rate limit exceeded",
                    message: rateLimit.message,
                    retryAfter: rateLimit.resetAt.toISOString(),
                },
                {
                    status: 429,
                    headers: {
                        "Retry-After": Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString(),
                    },
                }
            );
        }

        const rates = await db.select({
            currency: exchangeRates.currency,
            rate: exchangeRates.rate,
            updatedAt: exchangeRates.updatedAt,
        }).from(exchangeRates);

        // If no rates in database, return default hardcoded rates
        if (rates.length === 0) {
            return NextResponse.json({
                rates: {
                    EUR: 1,
                    USD: 1.09,
                    GBP: 0.86,
                },
                source: "default",
                lastUpdated: null,
            });
        }

        // Convert array to object format
        const ratesObject = rates.reduce(
            (acc, { currency, rate }) => {
                acc[currency] = rate;
                return acc;
            },
            {} as Record<string, number>
        );

        // Get the most recent update time
        const lastUpdated = rates.reduce((latest, rate) => {
            return new Date(Math.max(latest.getTime(), rate.updatedAt.getTime()));
        }, rates[0].updatedAt);

        return NextResponse.json({
            rates: ratesObject,
            source: "database",
            lastUpdated: lastUpdated.toISOString(),
        });
    } catch (error) {
        console.error("Error fetching exchange rates:", error);

        // Fallback to default rates on error
        return NextResponse.json({
            rates: {
                EUR: 1,
                USD: 1.09,
                GBP: 0.86,
            },
            source: "fallback",
            lastUpdated: null,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}
