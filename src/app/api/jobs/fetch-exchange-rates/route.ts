import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Cron job to fetch and update exchange rates daily
 * Protected by CRON_SECRET environment variable
 * 
 * FreeCurrency API documentation: https://freecurrencyapi.com/docs/
 */
export async function GET(request: Request) {
    try {
        // Verify cron secret for production
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        if (process.env.NODE_ENV === "production") {
            if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
                return NextResponse.json(
                    { error: "Unauthorized" },
                    { status: 401 }
                );
            }
        }

        const apiKey = process.env.CURRENCY_CONVERSION_API;

        if (!apiKey) {
            console.error("CURRENCY_CONVERSION_API environment variable not set");
            return NextResponse.json(
                { error: "API key not configured" },
                { status: 500 }
            );
        }

        // Fetch exchange rates from FreeCurrency API
        // Base currency is EUR, fetching USD and GBP rates
        const response = await fetch(
            `https://api.freecurrencyapi.com/v1/latest?apikey=${apiKey}&base_currency=EUR&currencies=USD,GBP,EUR`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Failed to fetch exchange rates:", errorText);
            return NextResponse.json(
                { error: "Failed to fetch exchange rates" },
                { status: response.status }
            );
        }

        const data = await response.json();

        // FreeCurrency API response format: { data: { USD: 1.09, GBP: 0.86, EUR: 1.00 } }
        const rates = data.data;

        if (!rates) {
            console.error("Invalid API response format:", data);
            return NextResponse.json(
                { error: "Invalid API response" },
                { status: 500 }
            );
        }

        // Update rates in database
        const updatePromises = Object.entries(rates).map(
            async ([currency, rate]) => {
                await prisma.exchangeRate.upsert({
                    where: { currency },
                    update: { rate: rate as number },
                    create: {
                        currency,
                        rate: rate as number,
                    },
                });
            }
        );

        await Promise.all(updatePromises);

        console.log("Exchange rates updated successfully:", rates);

        return NextResponse.json({
            success: true,
            rates,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error updating exchange rates:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
