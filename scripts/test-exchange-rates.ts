/**
 * Test script for fetching exchange rates from FreeCurrency API
 * Run with: npm run test:exchange-rates
 */

import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function testExchangeRates() {
    const apiKey = process.env.CURRENCY_CONVERSION_API;

    if (!apiKey) {
        console.error("❌ CURRENCY_CONVERSION_API environment variable not set");
        console.log("Please add it to your .env.local file");
        return;
    }

    console.log("🔄 Fetching exchange rates from FreeCurrency API...\n");

    try {
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
            console.error("❌ Failed to fetch exchange rates:");
            console.error("Status:", response.status, response.statusText);
            console.error("Response:", errorText);
            return;
        }

        const data = await response.json();
        console.log("✅ Successfully fetched exchange rates!\n");
        console.log("📊 Rates (relative to EUR):");
        console.log(JSON.stringify(data, null, 2));

        if (data.data) {
            console.log("\n💱 Formatted rates:");
            for (const [currency, rate] of Object.entries(data.data)) {
                console.log(`  ${currency}: ${rate}`);
            }
        }

        console.log("\n✨ Exchange rates test completed successfully!");
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

testExchangeRates();
