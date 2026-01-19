import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { salaryEntries, entryReports } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const entryId = Number.parseInt(idParam);
    if (Number.isNaN(entryId)) {
      return NextResponse.json({ error: "Invalid entry ID" }, { status: 400 });
    }

    // Get all reports for this entry
    const reports = await db
      .select()
      .from(entryReports)
      .where(eq(entryReports.salaryEntryId, entryId))
      .orderBy(entryReports.createdAt);

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const entryId = Number.parseInt(idParam);
    if (Number.isNaN(entryId)) {
      return NextResponse.json({ error: "Invalid entry ID" }, { status: 400 });
    }

    // Parse request body for reason
    let reason: string | undefined;
    try {
      const body = await request.json();
      reason = body.reason;
    } catch {
      // Body is optional, continue without reason
    }

    // Check if entry exists
    const entry = await db
      .select()
      .from(salaryEntries)
      .where(eq(salaryEntries.id, entryId))
      .limit(1);

    if (!entry[0]) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const clientIP = getClientIP(request.headers);
    const userAgent = request.headers.get("user-agent") || undefined;

    // Check if this IP has already reported this entry
    const existingReport = await db
      .select()
      .from(entryReports)
      .where(
        and(
          eq(entryReports.salaryEntryId, entryId),
          eq(entryReports.ipAddress, clientIP)
        )
      )
      .limit(1);

    if (existingReport[0]) {
      return NextResponse.json(
        { error: "You have already reported this entry" },
        { status: 409 }
      );
    }

    // Rate limiting: 30 reports per day per IP
    const rateLimitResult = checkRateLimit(`${clientIP}:entry-report`, 30);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: rateLimitResult.message,
          remaining: rateLimitResult.remaining,
          resetAt: rateLimitResult.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    // Insert the report
    await db.insert(entryReports).values({
      salaryEntryId: entryId,
      ipAddress: clientIP,
      userAgent,
      reason,
    });

    // Increment the report count on the entry
    await db
      .update(salaryEntries)
      .set({
        reportCount: sql`${salaryEntries.reportCount} + 1`,
        // If the entry is approved, flag it for review
        reviewStatus: entry[0].reviewStatus === "APPROVED" ? "NEEDS_REVIEW" : undefined,
      })
      .where(eq(salaryEntries.id, entryId));

    return NextResponse.json(
      {
        success: true,
        message: "Entry reported successfully",
        rateLimit: {
          remaining: rateLimitResult.remaining,
          resetAt: rateLimitResult.resetAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error reporting entry:", error);
    return NextResponse.json({ error: "Failed to report entry" }, { status: 500 });
  }
}
