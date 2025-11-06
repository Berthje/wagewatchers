import { NextResponse } from "next/server";
import { getAnomalyStats } from "@/lib/anomaly-detector";
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

/**
 * GET - Fetch anomaly detection statistics
 */
export async function GET() {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await getAnomalyStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch anomaly stats:", error);
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
}
