import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { salaryEntries } from "@/lib/db/schema";
import { eq, inArray, desc } from "drizzle-orm";
import {
    generateOwnerToken,
    getEditableUntilDate,
} from "@/lib/entry-ownership";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiter";
import { detectAnomaly } from "@/lib/anomaly-detector";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const ids = searchParams.get("ids");

        if (ids) {
            const entryIds = ids.split(",").map(Number).filter((id) =>
                !Number.isNaN(id)
            );
            if (entryIds.length === 0) {
                return NextResponse.json([]);
            }

            const tokensParam = searchParams.get("tokens");
            if (!tokensParam) {
                return NextResponse.json(
                    { error: "Tokens required for entry verification" },
                    { status: 401 }
                );
            }

            const tokenMap = new Map<number, string>();
            try {
                const pairs = tokensParam.split(",");
                for (const pair of pairs) {
                    const [id, token] = pair.split(":");
                    if (id && token) {
                        tokenMap.set(Number(id), token);
                    }
                }
            } catch (e) {
                console.error("Token parsing error:", e);
                return NextResponse.json(
                    { error: "Invalid tokens format" },
                    { status: 400 }
                );
            }

            const entries = await db.select().from(salaryEntries)
                .where(inArray(salaryEntries.id, entryIds))
                .orderBy(desc(salaryEntries.createdAt));

            const validatedEntries = entries.filter((entry) => {
                const providedToken = tokenMap.get(entry.id);
                return providedToken && providedToken === entry.ownerToken;
            });

            return NextResponse.json(validatedEntries);
        }

        // Otherwise return only approved entries (default behavior)
        const entries = await db.select().from(salaryEntries).where(eq(salaryEntries.reviewStatus, 'APPROVED')).orderBy(desc(salaryEntries.createdAt));
        return NextResponse.json(entries);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to fetch entries" },
            {
                status: 500,
            },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        // Rate limiting: 5 submissions per day per IP
        const clientIP = getClientIP(request.headers);
        const rateLimit = checkRateLimit(`${clientIP}:entries-create`, 5);

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

        const body = await request.json();

        const bodyTyped: Omit<
            typeof salaryEntries.$inferInsert,
            "id" | "createdAt" | "ownerToken" | "editableUntil"
        > = body;

        // Generate ownership token and editable window
        const editableUntil = getEditableUntilDate();

        const entry = await db.insert(salaryEntries).values({
            ...bodyTyped,
            ownerToken: "", // Temporary, will update after getting ID
            editableUntil,
        }).returning();

        // Run anomaly detection on the new entry
        const anomalyResult = await detectAnomaly(entry[0]);

        // Generate token with the actual entry ID
        const ownerToken = generateOwnerToken(entry[0].id);

        // Update with the proper token and anomaly detection results
        const updatedEntry = await db.update(salaryEntries).set({
            ownerToken,
            reviewStatus: anomalyResult.reviewStatus,
            anomalyScore: anomalyResult.anomalyScore,
            anomalyReason: anomalyResult.reason,
        }).where(eq(salaryEntries.id, entry[0].id)).returning();

        // Return entry with the owner token (client will store it)
        return NextResponse.json({
            ...updatedEntry[0],
            ownerToken, // Include token in response for client storage
        });
    } catch (error) {
        console.error("Failed to create entry:", error);

        // Always return detailed error for debugging
        return NextResponse.json(
            {
                error: "Failed to create entry",
                details: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
