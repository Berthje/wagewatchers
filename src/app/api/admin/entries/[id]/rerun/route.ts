import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { salaryEntries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";
import { detectAnomaly } from "@/lib/anomaly-detector";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * POST - Re-run anomaly detection against the current corpus and store the
 * fresh score/status/reason. Useful after the corpus grows or thresholds change.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id: idParam } = await params;
    const id = Number.parseInt(idParam);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid entry ID" }, { status: 400 });
    }

    const [entry] = await db.select().from(salaryEntries).where(eq(salaryEntries.id, id)).limit(1);
    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const result = await detectAnomaly(entry);
    const [updated] = await db
      .update(salaryEntries)
      .set({
        reviewStatus: result.reviewStatus,
        anomalyScore: result.anomalyScore,
        anomalyReason: result.reason,
      })
      .where(eq(salaryEntries.id, id))
      .returning({
        id: salaryEntries.id,
        reviewStatus: salaryEntries.reviewStatus,
        anomalyScore: salaryEntries.anomalyScore,
      });

    return NextResponse.json({ success: true, entry: updated });
  } catch (error) {
    logError("Failed to re-run anomaly", error);
    return NextResponse.json({ error: "Failed to re-run anomaly" }, { status: 500 });
  }
}
