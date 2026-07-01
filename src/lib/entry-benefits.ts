import { db } from "@/lib/db";
import { salaryEntries, entryBenefits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { COLUMN_BACKED_BENEFIT_KEYS } from "@/lib/benefits-catalog";

export interface SubmittedBenefit {
  benefitKey: string;
  valueNumeric?: number | null;
  valueText?: string | null;
  currency?: string | null;
}

/**
 * Build EntryBenefit rows for an entry: the catalog benefits the user selected,
 * plus dual-written rows for the column-backed core benefits (meal vouchers,
 * eco-cheques, 13th month, group insurance) so the catalog is a complete view.
 */
function buildBenefitRows(
  entryId: number,
  submitted: SubmittedBenefit[] | undefined,
  entry: typeof salaryEntries.$inferSelect
): (typeof entryBenefits.$inferInsert)[] {
  const rows: (typeof entryBenefits.$inferInsert)[] = [];
  const seen = new Set<string>();

  for (const b of submitted ?? []) {
    if (!b?.benefitKey || seen.has(b.benefitKey)) continue;
    seen.add(b.benefitKey);
    rows.push({
      salaryEntryId: entryId,
      benefitKey: b.benefitKey,
      valueNumeric: b.valueNumeric ?? null,
      valueText: b.valueText ?? null,
      currency: b.currency ?? entry.currency ?? null,
    });
  }

  const columnValues: Record<string, { valueNumeric?: number | null; valueText?: string | null }> =
    {
      mealVouchers: { valueNumeric: entry.mealVouchers },
      ecoCheques: { valueNumeric: entry.ecoCheques },
      thirteenthMonth: { valueText: entry.thirteenthMonth },
      groupInsurance: { valueText: entry.groupInsurance },
    };
  for (const key of COLUMN_BACKED_BENEFIT_KEYS) {
    if (seen.has(key)) continue;
    const v = columnValues[key];
    const hasNumeric = v.valueNumeric !== null && v.valueNumeric !== undefined;
    const hasText = v.valueText !== null && v.valueText !== undefined && v.valueText !== "";
    if (!hasNumeric && !hasText) continue;
    rows.push({
      salaryEntryId: entryId,
      benefitKey: key,
      valueNumeric: v.valueNumeric ?? null,
      valueText: v.valueText ?? null,
      currency: entry.currency ?? null,
    });
  }

  return rows;
}

/** Insert benefit rows for a freshly created entry. */
export async function persistEntryBenefits(
  entryId: number,
  submitted: SubmittedBenefit[] | undefined,
  entry: typeof salaryEntries.$inferSelect
) {
  const rows = buildBenefitRows(entryId, submitted, entry);
  if (rows.length > 0) await db.insert(entryBenefits).values(rows);
}

/** Replace all benefit rows for an existing entry (used on edit). */
export async function replaceEntryBenefits(
  entryId: number,
  submitted: SubmittedBenefit[] | undefined,
  entry: typeof salaryEntries.$inferSelect
) {
  await db.delete(entryBenefits).where(eq(entryBenefits.salaryEntryId, entryId));
  await persistEntryBenefits(entryId, submitted, entry);
}

/** Remove all benefit rows for an entry (FK-safe cleanup before deleting it). */
export async function deleteEntryBenefits(entryId: number) {
  await db.delete(entryBenefits).where(eq(entryBenefits.salaryEntryId, entryId));
}

/** Fetch the benefit rows for an entry. */
export async function getEntryBenefits(entryId: number) {
  return db.select().from(entryBenefits).where(eq(entryBenefits.salaryEntryId, entryId));
}
