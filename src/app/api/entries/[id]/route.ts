import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { isEntryEditable } from "@/lib/entry-ownership";

const prisma = new PrismaClient();

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

        const entry = await prisma.salaryEntry.findUnique({
            where: { id },
        });

        if (!entry) {
            return NextResponse.json(
                { error: "Entry not found" },
                { status: 404 },
            );
        }

        return NextResponse.json(entry);
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

        const body = await request.json();
        const { ownerToken, ...updateData } = body;

        // Verify the entry exists
        const existingEntry = await prisma.salaryEntry.findUnique({
            where: { id },
        });

        if (!existingEntry) {
            return NextResponse.json(
                { error: "Entry not found" },
                { status: 404 },
            );
        }

        // Verify ownership
        if (!ownerToken || existingEntry.ownerToken !== ownerToken) {
            return NextResponse.json(
                { error: "Unauthorized: Invalid or missing owner token" },
                { status: 403 },
            );
        }

        // Check if entry is still editable
        if (!isEntryEditable(existingEntry.editableUntil)) {
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
        const updatedEntry = await prisma.salaryEntry.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updatedEntry);
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
        const existingEntry = await prisma.salaryEntry.findUnique({
            where: { id },
        });

        if (!existingEntry) {
            return NextResponse.json(
                { error: "Entry not found" },
                { status: 404 },
            );
        }

        // Verify ownership
        if (!ownerToken || existingEntry.ownerToken !== ownerToken) {
            return NextResponse.json(
                { error: "Unauthorized: Invalid or missing owner token" },
                { status: 403 },
            );
        }

        // Check if entry is still editable (allow deletion within edit window)
        if (!isEntryEditable(existingEntry.editableUntil)) {
            return NextResponse.json(
                {
                    error:
                        "This entry can no longer be deleted (edit window expired)",
                },
                { status: 403 },
            );
        }

        // Delete the entry
        await prisma.salaryEntry.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, message: "Entry deleted" });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to delete entry" },
            { status: 500 },
        );
    }
}
