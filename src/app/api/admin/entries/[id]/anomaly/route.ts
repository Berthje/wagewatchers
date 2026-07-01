import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { salaryEntries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";
import { explainAnomaly } from "@/lib/anomaly-detector";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET - Recompute the anomaly breakdown for one entry (the review dossier).
 * Read-only; does not change stored detection results.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const explanation = await explainAnomaly(entry);
    return NextResponse.json(explanation);
  } catch (error) {
    logError("Failed to explain anomaly", error);
    return NextResponse.json({ error: "Failed to analyze entry" }, { status: 500 });
  }
}
