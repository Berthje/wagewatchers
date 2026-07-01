import { db } from "../src/lib/db";
import { benefitDefinitions } from "../src/lib/db/schema";
import { BENEFIT_DEFINITIONS } from "../src/lib/benefits-catalog";

/**
 * Seed / upsert the BenefitDefinition catalog from the typed source of truth in
 * src/lib/benefits-catalog.ts. Idempotent — safe to re-run; it only inserts new
 * keys and updates the metadata of existing ones. Never deletes rows.
 *
 * Run against the dev DB first:
 *   pnpm db:generate   (already done — migration 0014 must be applied first)
 *   tsx scripts/run-with-dev-db.ts tsx scripts/seed-benefits.ts
 */
async function seedBenefits() {
  let inserted = 0;
  for (const def of BENEFIT_DEFINITIONS) {
    await db
      .insert(benefitDefinitions)
      .values({
        key: def.key,
        category: def.category,
        valueType: def.valueType,
        countries: def.countries ?? null,
        workerTypes: def.workerTypes ?? null,
      })
      .onConflictDoUpdate({
        target: benefitDefinitions.key,
        set: {
          category: def.category,
          valueType: def.valueType,
          countries: def.countries ?? null,
          workerTypes: def.workerTypes ?? null,
        },
      });
    inserted++;
  }
  console.log(`✅ Upserted ${inserted} benefit definitions.`);
}

seedBenefits()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Failed to seed benefit definitions:", err);
    process.exit(1);
  });
