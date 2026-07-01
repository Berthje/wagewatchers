import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { salaryEntries, entryReports, comments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteEntryBenefits } from "@/lib/entry-benefits";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * DELETE - Admin delete of any entry (no owner token required, unlike the
 * public route). Removes dependent rows first: benefits carry a FK constraint;
 * reports and comments are cleaned up to avoid orphans.
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id: idParam } = await params;
    const id = Number.parseInt(idParam);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid entry ID" }, { status: 400 });
    }

    await deleteEntryBenefits(id);
    await db.delete(entryReports).where(eq(entryReports.salaryEntryId, id));
    await db.delete(comments).where(eq(comments.salaryEntryId, id));
    const deleted = await db
      .delete(salaryEntries)
      .where(eq(salaryEntries.id, id))
      .returning({ id: salaryEntries.id });

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("Failed to delete entry (admin)", error);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
