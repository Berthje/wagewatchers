import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { salaryEntries } from "@/lib/db/schema";
import { eq, inArray, desc } from "drizzle-orm";
import {
    generateOwnerToken,
    getEditableUntilDate,
} from "@/lib/entry-ownership";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiter";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const ids = searchParams.get("ids");

        // If specific IDs are requested (for "My Entries" feature)
        if (ids) {
            const entryIds = ids.split(",").map(Number).filter((id) =>
                !Number.isNaN(id)
            );
            if (entryIds.length === 0) {
                return NextResponse.json([]);
            }

            const entries = await db.select().from(salaryEntries).where(inArray(salaryEntries.id, entryIds)).orderBy(desc(salaryEntries.createdAt));
            return NextResponse.json(entries);
        }

        // Otherwise return all entries (default behavior)
        const entries = await db.select().from(salaryEntries).orderBy(desc(salaryEntries.createdAt));
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

        // Generate token with the actual entry ID
        const ownerToken = generateOwnerToken(entry[0].id);

        // Update with the proper token
        const updatedEntry = await db.update(salaryEntries).set({ ownerToken }).where(eq(salaryEntries.id, entry[0].id)).returning();

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
