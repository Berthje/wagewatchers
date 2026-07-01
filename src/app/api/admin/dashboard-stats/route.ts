import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/admin-stats";
import { requireAdmin } from "@/lib/admin-auth";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET - Read-only aggregation for the admin Command Center dashboard.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    logError("Failed to build dashboard stats", error);
    return NextResponse.json({ error: "Failed to load dashboard stats" }, { status: 500 });
  }
}
