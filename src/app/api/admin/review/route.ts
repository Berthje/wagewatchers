import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { salaryEntries } from "@/lib/db/schema";
import { eq, or, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET - Fetch entries pending review
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";

    let entries;

    if (status === "all") {
      // Get all non-approved entries
      entries = await db
        .select()
        .from(salaryEntries)
        .where(
          or(
            eq(salaryEntries.reviewStatus, "PENDING"),
            eq(salaryEntries.reviewStatus, "NEEDS_REVIEW")
          )
        )
        .orderBy(desc(salaryEntries.anomalyScore), desc(salaryEntries.createdAt));
    } else {
      // Get entries by specific status
      entries = await db
        .select()
        .from(salaryEntries)
        .where(eq(salaryEntries.reviewStatus, status as any))
        .orderBy(desc(salaryEntries.anomalyScore), desc(salaryEntries.createdAt));
    }

    return NextResponse.json(entries);
  } catch (error) {
    logError("Failed to fetch pending entries", error);
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}

/**
 * POST - Approve or reject an entry
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { entryId, action } = body as { entryId: number; action: "approve" | "reject" };

    if (!entryId || !action) {
      return NextResponse.json({ error: "Missing entryId or action" }, { status: 400 });
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

    const updatedEntry = await db
      .update(salaryEntries)
      .set({
        reviewStatus: newStatus,
        reviewedBy: auth.adminId,
        reviewedAt: new Date(),
      })
      .where(eq(salaryEntries.id, entryId))
      .returning();

    if (updatedEntry.length === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      entry: updatedEntry[0],
    });
  } catch (error) {
    logError("Failed to update entry", error);
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }
}
