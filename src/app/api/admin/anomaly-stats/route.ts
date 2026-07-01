import { NextResponse } from "next/server";
import { getAnomalyStats } from "@/lib/anomaly-detector";
import { requireAdmin } from "@/lib/admin-auth";
import { logError } from "@/lib/logger";

/**
 * GET - Fetch anomaly detection statistics
 */
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const stats = await getAnomalyStats();
    return NextResponse.json(stats);
  } catch (error) {
    logError("Failed to fetch anomaly stats", error);
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
}
