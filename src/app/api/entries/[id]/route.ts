import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { salaryEntries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isEntryEditable, verifyOwnerToken } from "@/lib/entry-ownership";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiter";

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id: idParam } = await params;
        const id = Number.parseInt(idParam);
        if (Number.isNaN(id)) {
            return NextResponse.json(
                { error: "Invalid entry ID" },
                { status: 400 },
            );
        }

        const entry = await db.select().from(salaryEntries).where(eq(salaryEntries.id, id)).limit(1);

        if (!entry[0]) {
            return NextResponse.json(
                { error: "Entry not found" },
                { status: 404 },
            );
        }

        return NextResponse.json(entry[0]);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to fetch entry" },
            { status: 500 },
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id: idParam } = await params;
        const id = Number.parseInt(idParam);
        if (Number.isNaN(id)) {
            return NextResponse.json(
                { error: "Invalid entry ID" },
                { status: 400 },
            );
        }

        // Rate limiting: 10 edits per entry (prevents spam editing of individual posts)
        const clientIP = getClientIP(request.headers);
        const rateLimit = checkRateLimit(`${clientIP}:entry-edit:${id}`, 10);

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
        const { ownerToken, ...updateData } = body;

        // Verify the entry exists
        const existingEntry = await db.select().from(salaryEntries).where(eq(salaryEntries.id, id)).limit(1);

        if (!existingEntry[0]) {
            return NextResponse.json(
                { error: "Entry not found" },
                { status: 404 },
            );
        }

        // Verify ownership
        if (!ownerToken || !verifyOwnerToken(ownerToken, id, existingEntry[0].ownerToken, existingEntry[0].editableUntil)) {
            return NextResponse.json(
                { error: "Unauthorized: Invalid or missing owner token" },
                { status: 403 },
            );
        }

        // Check if entry is still editable
        if (!isEntryEditable(existingEntry[0].editableUntil)) {
            return NextResponse.json(
                {
                    error:
                        "This entry is no longer editable (edit window expired)",
                },
                { status: 403 },
            );
        }

        // Don't allow updating ownerToken or editableUntil through this endpoint
        delete updateData.ownerToken;
        delete updateData.editableUntil;
        delete updateData.id;
        delete updateData.createdAt;

        // Update the entry
        const updatedEntry = await db.update(salaryEntries).set(updateData).where(eq(salaryEntries.id, id)).returning();

        return NextResponse.json(updatedEntry[0]);
    } catch (error) {
        console.error("Failed to update entry:", error);

        // Always return detailed error for debugging
        return NextResponse.json(
            {
                error: "Failed to update entry",
                details: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id: idParam } = await params;
        const id = Number.parseInt(idParam);
        if (Number.isNaN(id)) {
            return NextResponse.json(
                { error: "Invalid entry ID" },
                { status: 400 },
            );
        }

        // Get owner token from request body
        const body = await request.json();
        const { ownerToken } = body;

        // Verify the entry exists
        const existingEntry = await db.select().from(salaryEntries).where(eq(salaryEntries.id, id)).limit(1);

        if (!existingEntry[0]) {
            return NextResponse.json(
                { error: "Entry not found" },
                { status: 404 },
            );
        }

        // Verify ownership
        if (!ownerToken || existingEntry[0].ownerToken !== ownerToken) {
            return NextResponse.json(
                { error: "Unauthorized: Invalid or missing owner token" },
                { status: 403 },
            );
        }

        // Check if entry is still editable (allow deletion within edit window)
        if (!isEntryEditable(existingEntry[0].editableUntil)) {
            return NextResponse.json(
                {
                    error:
                        "This entry can no longer be deleted (edit window expired)",
                },
                { status: 403 },
            );
        }

        // Delete the entry
        await db.delete(salaryEntries).where(eq(salaryEntries.id, id));

        return NextResponse.json({ success: true, message: "Entry deleted" });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to delete entry" },
            { status: 500 },
        );
    }
}
