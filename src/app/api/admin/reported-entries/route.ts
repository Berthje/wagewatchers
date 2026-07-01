import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { salaryEntries, entryReports } from "@/lib/db/schema";
import { eq, gt, desc, inArray } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";
import { withoutOwnerToken } from "@/lib/entry-ownership";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET - Entries with user reports, each joined to its report reasons.
 * The highest-signal moderation queue: user-flagged content.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const reported = await db
      .select()
      .from(salaryEntries)
      .where(gt(salaryEntries.reportCount, 0))
      .orderBy(desc(salaryEntries.reportCount), desc(salaryEntries.createdAt))
      .limit(100);

    const ids = reported.map((e) => e.id);
    const rows = ids.length
      ? await db
          .select()
          .from(entryReports)
          .where(inArray(entryReports.salaryEntryId, ids))
          .orderBy(desc(entryReports.createdAt))
      : [];

    const byEntry = new Map<number, { reason: string | null; createdAt: string }[]>();
    for (const r of rows) {
      const list = byEntry.get(r.salaryEntryId) ?? [];
      list.push({
        reason: r.reason,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
      });
      byEntry.set(r.salaryEntryId, list);
    }

    return NextResponse.json(
      reported.map((e) => ({ entry: withoutOwnerToken(e), reports: byEntry.get(e.id) ?? [] }))
    );
  } catch (error) {
    logError("Failed to fetch reported entries", error);
    return NextResponse.json({ error: "Failed to fetch reported entries" }, { status: 500 });
  }
}

/**
 * POST - Resolve a reported entry.
 * dismiss → keep it (APPROVED), clear the reports; reject → REJECTED, clear reports.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { entryId, action } = await request.json();
    if (typeof entryId !== "number" || (action !== "dismiss" && action !== "reject")) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const newStatus = action === "dismiss" ? "APPROVED" : "REJECTED";
    await db
      .update(salaryEntries)
      .set({ reviewStatus: newStatus, reportCount: 0, reviewedBy: auth.adminId, reviewedAt: new Date() })
      .where(eq(salaryEntries.id, entryId));
    await db.delete(entryReports).where(eq(entryReports.salaryEntryId, entryId));

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("Failed to resolve reported entry", error);
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }
}
