import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, SalaryEntry } from "@prisma/client";
import {
    generateOwnerToken,
    getEditableUntilDate,
} from "@/lib/entry-ownership";

const prisma = new PrismaClient();

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

            const entries: SalaryEntry[] = await prisma.salaryEntry.findMany({
                where: {
                    id: { in: entryIds },
                },
                orderBy: { createdAt: "desc" },
            });
            return NextResponse.json(entries);
        }

        // Otherwise return all entries (default behavior)
        const entries: SalaryEntry[] = await prisma.salaryEntry.findMany({
            orderBy: { createdAt: "desc" },
        });
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
        const body = await request.json();

        const bodyTyped: Omit<
            SalaryEntry,
            "id" | "createdAt" | "ownerToken" | "editableUntil"
        > = body;

        // Generate ownership token and editable window
        const editableUntil = getEditableUntilDate();

        const entry = await prisma.salaryEntry.create({
            data: {
                ...bodyTyped,
                ownerToken: "", // Temporary, will update after getting ID
                editableUntil,
            },
        });

        // Generate token with the actual entry ID
        const ownerToken = generateOwnerToken(entry.id);

        // Update with the proper token
        const updatedEntry = await prisma.salaryEntry.update({
            where: { id: entry.id },
            data: { ownerToken },
        });

        // Return entry with the owner token (client will store it)
        return NextResponse.json({
            ...updatedEntry,
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
