import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { salaryEntries } from "@/lib/db/schema";
import { and, eq, inArray, desc, gte, lte, gt, ilike, type SQL } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";
import { withoutOwnerToken } from "@/lib/entry-ownership";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

const ALL_STATUSES = ["APPROVED", "PENDING", "NEEDS_REVIEW", "REJECTED"];

/**
 * GET - Fetch entries for review, with filters.
 *
 * status:  omitted / "queue" → PENDING + NEEDS_REVIEW; "all" → every status;
 *          or a comma-separated list of statuses.
 * workerType, country, minScore, maxScore, reportedOnly, q (jobTitle search).
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const workerType = searchParams.get("workerType");
    const country = searchParams.get("country");
    const minScore = searchParams.get("minScore");
    const maxScore = searchParams.get("maxScore");
    const reportedOnly = searchParams.get("reportedOnly") === "true";
    const q = searchParams.get("q");
    const limit = Math.min(Number(searchParams.get("limit")) || 200, 500);

    const conditions: SQL[] = [];

    if (!statusParam || statusParam === "queue") {
      conditions.push(inArray(salaryEntries.reviewStatus, ["PENDING", "NEEDS_REVIEW"]));
    } else if (statusParam !== "all") {
      const statuses = statusParam.split(",").filter((s) => ALL_STATUSES.includes(s));
      if (statuses.length) {
        conditions.push(
          inArray(
            salaryEntries.reviewStatus,
            statuses as ("APPROVED" | "PENDING" | "NEEDS_REVIEW" | "REJECTED")[]
          )
        );
      }
    }

    if (workerType) conditions.push(eq(salaryEntries.workerType, workerType as never));
    if (country) conditions.push(eq(salaryEntries.country, country));
    if (minScore) conditions.push(gte(salaryEntries.anomalyScore, Number(minScore)));
    if (maxScore) conditions.push(lte(salaryEntries.anomalyScore, Number(maxScore)));
    if (reportedOnly) conditions.push(gt(salaryEntries.reportCount, 0));
    if (q) conditions.push(ilike(salaryEntries.jobTitle, `%${q}%`));

    const rows = await db
      .select()
      .from(salaryEntries)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(salaryEntries.anomalyScore), desc(salaryEntries.createdAt))
      .limit(limit);

    return NextResponse.json(rows.map(withoutOwnerToken));
  } catch (error) {
    logError("Failed to fetch review entries", error);
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}

/**
 * POST - Approve or reject one entry ({ entryId, action }) or many
 * ({ entryIds: number[], action }).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const action = body.action as "approve" | "reject";

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    const ids: number[] = Array.isArray(body.entryIds)
      ? body.entryIds.filter((n: unknown): n is number => typeof n === "number")
      : typeof body.entryId === "number"
        ? [body.entryId]
        : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: "No entry id(s) provided" }, { status: 400 });
    }

    const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

    const updated = await db
      .update(salaryEntries)
      .set({ reviewStatus: newStatus, reviewedBy: auth.adminId, reviewedAt: new Date() })
      .where(inArray(salaryEntries.id, ids))
      .returning({ id: salaryEntries.id });

    return NextResponse.json({ success: true, count: updated.length });
  } catch (error) {
    logError("Failed to update review entries", error);
    return NextResponse.json({ error: "Failed to update entries" }, { status: 500 });
  }
}
