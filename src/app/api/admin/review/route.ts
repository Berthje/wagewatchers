import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { salaryEntries } from "@/lib/db/schema";
import { eq, or, desc } from "drizzle-orm";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";

// Verify admin authentication
async function verifyAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin-token");

    if (!token) {
      return false;
    }

    verify(token.value, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

// Get admin ID from token
async function getAdminId(): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin-token");

    if (!token) {
      return null;
    }

    const decoded = verify(token.value, JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch {
    return null;
  }
}

/**
 * GET - Fetch entries pending review
 */
export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    console.error("Failed to fetch pending entries:", error);
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}

/**
 * POST - Approve or reject an entry
 */
export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    const adminId = await getAdminId();
    const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

    const updatedEntry = await db
      .update(salaryEntries)
      .set({
        reviewStatus: newStatus,
        reviewedBy: adminId,
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
    console.error("Failed to update entry:", error);
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }
}
