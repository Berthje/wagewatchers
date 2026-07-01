import { db } from "../src/lib/db";
import { degrees } from "../src/lib/db/schema";
import { DEGREE_DEFINITIONS } from "../src/lib/degrees-catalog";

/**
 * Seed / upsert the Degree lookup from the typed catalog. Idempotent — inserts
 * with the catalog's stable ids so SalaryEntry.degreeId stays in sync with the
 * form picker. Re-running updates metadata; never deletes.
 *
 *   tsx scripts/run-with-dev-db.ts tsx scripts/seed-degrees.ts
 */
async function seedDegrees() {
  for (const d of DEGREE_DEFINITIONS) {
    await db
      .insert(degrees)
      .values({
        id: d.id,
        name: d.name,
        field: d.field,
        level: d.level,
        countries: d.countries ?? null,
      })
      .onConflictDoUpdate({
        target: degrees.id,
        set: { name: d.name, field: d.field, level: d.level, countries: d.countries ?? null },
      });
  }
  console.log(`✅ Upserted ${DEGREE_DEFINITIONS.length} degrees.`);
}

seedDegrees()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Failed to seed degrees:", err);
    process.exit(1);
  });
