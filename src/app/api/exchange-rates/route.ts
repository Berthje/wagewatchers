import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Cache rates for 1 hour to avoid frequent DB queries
export const revalidate = 3600;

/**
 * GET endpoint to retrieve current exchange rates
 * Used by the frontend to get live rates
 */
export async function GET() {
    try {
        const rates = await prisma.exchangeRate.findMany({
            select: {
                currency: true,
                rate: true,
                updatedAt: true,
            },
        });

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
            return rate.updatedAt > latest ? rate.updatedAt : latest;
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
