import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { salaryEntries } from "@/lib/db/schema";
import { and, or, eq, ilike, desc, sql, type SQL } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";
import { withoutOwnerToken } from "@/lib/entry-ownership";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET - Browse the full entry corpus (not just the review queue), paginated.
 * Filters: q (job title / sector / country), status, workerType, country.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status");
    const workerType = searchParams.get("workerType");
    const country = searchParams.get("country");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

    const conditions: SQL[] = [];
    if (q) {
      const like = `%${q}%`;
      const search = or(
        ilike(salaryEntries.jobTitle, like),
        ilike(salaryEntries.sector, like),
        ilike(salaryEntries.country, like)
      );
      if (search) conditions.push(search);
    }
    if (status && status !== "all") conditions.push(eq(salaryEntries.reviewStatus, status as never));
    if (workerType && workerType !== "all") {
      conditions.push(eq(salaryEntries.workerType, workerType as never));
    }
    if (country) conditions.push(eq(salaryEntries.country, country));

    const where = conditions.length ? and(...conditions) : undefined;

    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(salaryEntries)
        .where(where)
        .orderBy(desc(salaryEntries.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(salaryEntries).where(where),
    ]);

    return NextResponse.json({
      rows: rows.map(withoutOwnerToken),
      total: Number(countRows[0]?.count ?? 0),
      limit,
      offset,
    });
  } catch (error) {
    logError("Failed to browse entries", error);
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}
