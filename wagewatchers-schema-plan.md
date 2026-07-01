# WageWatchers — Schema & Feature Plan (against current codebase)

Drafted against the live schema in [src/lib/db/schema.ts](src/lib/db/schema.ts) (PostgreSQL + Drizzle).
Constraint reminder: **no migration of the ~1,900 existing rows**; all changes are **additive & nullable**; old rows keep nulls, new rows follow the new structure.

---

## What already exists (don't rebuild)

| Need from feedback | Status in code |
|---|---|
| Edit own entry + grace period | **Already built** — `ownerToken` + `editableUntil` on `SalaryEntry`, token returned on insert ([api/entries/route.ts](src/app/api/entries/route.ts)). Just needs clearer UX. |
| Country-aware forms | **Pattern exists** — `COUNTRY_FORM_CONFIGS` in [salary-config.ts](src/lib/salary-config.ts) drives form sections per country. New per-country fields plug in here. |
| Gross vs net | Partial — `grossSalary`, `netSalary`, `netCompensation` all exist (monthly, currency-aware). Missing: explicit *basis* flag + fixed/variable split. |
| Meal vouchers / eco cheques / 13th month | Exist as `mealVouchers`, `ecoCheques`, `thirteenthMonth`. |
| Currency + conversion | EUR/USD/GBP + `ExchangeRate` table + `convertCurrency()`. |
| City geo lookup | `City` table with `countryCode`/`admin1Code`/`admin2Code`/lat/long. `admin1` = province → reuse for province granularity. |

**History signal:** migrations `0011→0013` added then fully removed structured `bonus*` and `rsu*` columns. Conclusion: wide-column-per-benefit churns badly. The new design must avoid repeating that — see benefits decision below.

---

## Core architectural proposal

Three layers, so each feedback item lands in the cheapest place that still supports **filtering** and **per-country scaling**:

### Layer A — discriminator (new, drives the whole form)
- `entryVersion` `smallint` default `2` — old rows are implicitly v1 (null), new rows v2. Lets the UI know which field set to render and keeps stats honest (don't mix v1/v2 where structure differs).
- `workerType` `text` enum: `whiteCollar` | `blueCollar` | `freelancer` | `intern` | `phdResearcher`. Drives which compensation fields show.

### Layer B — structured core columns (new, nullable)
These are universal (not country-specific) and are heavily **filtered/charted**, so they earn real columns:

```ts
// added to salaryEntries — all nullable, additive
entryVersion:        smallint("entryVersion").default(2),
workerType:          text("workerType"),            // enum above

// compensation model (worker-type dependent)
salaryBasis:         text("salaryBasis"),           // "gross" | "net" | "both"
fixedGrossSalary:    real("fixedGrossSalary"),      // monthly — fixed part
variableGrossSalary: real("variableGrossSalary"),   // monthly — bonus/variable part
hourlyRate:          real("hourlyRate"),            // blue-collar
dayRate:             real("dayRate"),               // freelancer
agencyCutPercent:    real("agencyCutPercent"),      // freelancer — middleman %
clientDayBudget:     real("clientDayBudget"),       // freelancer — total client budget/day
bursaryAmount:       real("bursaryAmount"),         // PhD — actual paid bursary
virtualGrossSalary:  real("virtualGrossSalary"),    // PhD — institute's virtual gross

// contract context
contractType:        text("contractType"),          // "permanent" | "fixedTerm" | "interim" | "internship" | "freelance"
contractDurationMonths: integer("contractDurationMonths"),

// HIGH-VALUE FILTER FLAGS (denormalized booleans for fast column/filter)
hasCompanyCar:       boolean("hasCompanyCar"),
companyCarType:      text("companyCarType"),         // "small" | "medium" | "large"
hasEquity:           boolean("hasEquity"),           // stocks/RSUs/warrants — CROSS-COUNTRY, not US-only

// location granularity + cross-border
locationGranularity: text("locationGranularity"),    // "country" | "province" | "city"
workProvince:        text("workProvince"),           // admin1 code/name
residenceCountry:    text("residenceCountry"),        // for grenswerkers (live ≠ work country)
commuteUnit:         text("commuteUnit"),             // "km" | "minutes" — pairs with existing commuteDistance

// education
degreeId:            integer("degreeId"),             // FK → Degree lookup (below); keep existing `education` level too
```

> `hasCompanyCar` and `hasEquity` are deliberately denormalized booleans on the row. They answer the two most-requested filters ("does the package include a car?", "stocks?") with a trivial indexed `WHERE`, even though the *details* live in Layer C.

### Layer C — flexible benefits catalog (new, replaces the bolt-on-columns pattern that was reverted)

Two new tables instead of one column-per-benefit:

```ts
// catalog of every benefit we know about, scoped by country availability
export const benefitDefinitions = pgTable("BenefitDefinition", {
  id:          serial("id").primaryKey(),
  key:         text("key").notNull(),          // "mealVouchers", "hospitalizationInsurance", "vakantiegeld8pct", "ticketsRestaurant", "fourZeroOneK", ...
  category:    text("category").notNull(),      // "insurance" | "equity" | "mobility" | "cash" | "other"
  valueType:   text("valueType").notNull(),     // "boolean" | "amount" | "percent" | "enum" | "text"
  countries:   text("countries").array(),       // ["BE","NL","FR","DE","US"] or null = universal
});

// one row per benefit a person actually has on an entry
export const entryBenefits = pgTable("EntryBenefit", {
  id:            serial("id").primaryKey(),
  salaryEntryId: integer("salaryEntryId").notNull().references(() => salaryEntries.id),
  benefitKey:    text("benefitKey").notNull(),  // matches BenefitDefinition.key
  valueNumeric:  real("valueNumeric"),
  valueText:     text("valueText"),
  currency:      text("currency"),
}, (t) => [index("entryBenefit_entry_idx").on(t.salaryEntryId)]);
```

Why this shape:
- **Scales per country with data, not schema** — adding France's `mutuelle` or NL's `vakantiegeld` is one catalog row, never a migration. This is the direct fix for the bonus/RSU churn.
- Covers the entire requested package list (stocks, warrants, meal vouchers, hospitalization/dental/ambulatory/salary-loss insurance, phone, laptop, fuel card, retirement plan, homework fee, WIFI, 13th month, salary increase frequency, **+ "other"**) as catalog entries.
- The existing scalar benefit columns (`mealVouchers`, `ecoCheques`, `thirteenthMonth`, `groupInsurance`) stay for v1 rows; v2 writes them as catalog rows. (Or keep writing both during transition — decision below.)

---

## Per-feedback mapping

| # | Feedback | Lands in | Notes |
|---|---|---|---|
| 1 | Freelancer / blue-collar / white-collar / intern / PhD | `workerType` + Layer B money fields | Form branches on `workerType`. |
| 1 | Day rate, agency %, client budget | `dayRate`, `agencyCutPercent`, `clientDayBudget` | |
| 1 | Contract duration (interns/temp) | `contractType`, `contractDurationMonths` | |
| 1 | PhD bursary / virtual gross | `bursaryAmount`, `virtualGrossSalary` | salaryBasis can be n/a. |
| 2 | Company car as option + filter/column | `hasCompanyCar` + `companyCarType` | Boolean = the filter; type = the detail. |
| 2 | Fixed vs variable split | `fixedGrossSalary` + `variableGrossSalary` | grossSalary stays = total. |
| 2 | Gross/net clarity | `salaryBasis` | Always shown in UI per entry. |
| 2 | Full benefits + stocks (cross-country) + "other" | `entryBenefits` catalog + `hasEquity` flag | |
| 3 | Specific degree from a list + filter | new `Degree` lookup + `degreeId` | Mirror the `City` table pattern. Big *content* effort (curate degree list), small *structural* effort. |
| 4 | "My position vs peers" / filter by age, exp, sector, diploma | **Query/UI feature** | No schema change beyond `degreeId`; build on existing fields. Possible separate "simulation" view. |
| 5 | Commute unit km/minutes | `commuteUnit` | Pairs with existing `commuteDistance`. |
| 5 | Country/province/city granularity | `locationGranularity` + `workProvince` (+ existing `workCity`/`country`) | Reuse `City.admin1Code` for province. |
| 5 | Grenswerkers (cross-border) | `residenceCountry` vs work `country` | Enables live-BE/work-NL analysis. |
| 6 | Edit entries + grace period | **Exists** (`ownerToken`/`editableUntil`) | UX-only: show countdown + lock state clearly. |
| 7 | "Salary Distribution by Experience" graph bug (mobile) | bug in [experience-growth-chart.tsx](src/components/statistics/experience-growth-chart.tsx) | Needs investigation — box-plot Q1/median/Q3 vs the rendered line. Separate task. |

---

## Suggested benefit catalog seed (per country)

Universal: stocks/equity/warrants/RSUs (+vesting), bonus, 13th month, retirement/pension, phone, laptop, fuel card, meal vouchers, hospitalization/dental/ambulatory/salary-loss insurance, homework allowance, WIFI/internet, salary-increase frequency, paid leave days, "other".
- **BE:** eco-cheques, cafeteria plan, group insurance, bike lease, mobility budget, net expense allowance, IP/auteursrechten (IT).
- **NL:** 8% vakantiegeld, 30%-ruling, pensioenregeling, lease car, reiskostenvergoeding, thuiswerkvergoeding.
- **FR:** tickets restaurant, mutuelle, participation/intéressement, RTT, 50% transport, CSE benefits.
- **DE:** Weihnachtsgeld, Urlaubsgeld, VWL, Deutschlandticket/Jobticket, betriebliche Altersvorsorge, JobRad.
- **US:** 401(k) match, health/dental/vision, PTO, sign-on bonus, HSA/FSA. (Equity is universal, above.)

---

## Suggested rollout order

1. **Bug fix** — experience chart (no schema; quick win, user-visible).
2. **Edit-UX clarity** — grace-period countdown/lock messaging (no schema).
3. **Layer A + B columns** + `workerType`-branching form (additive migration).
4. **Benefits catalog** (Layer C) + seed BE benefits; migrate the form's benefit inputs to catalog.
5. **Degree lookup** (curate list) + filter.
6. **Location granularity + cross-border + commute unit.**
7. **Analytics:** "my position vs peers" view + per-country expansion (NL first).

---

## Decisions (resolved)
1. **Benefits storage → normalized catalog tables** (`BenefitDefinition` + `EntryBenefit`). Confirmed. Per-country benefits added as catalog data, never migrations. `hasCompanyCar`/`hasEquity` stay as denormalized booleans for fast filtering.
2. **Bonus/RSU columns (0011–0013) were "not ready yet"** — premature/incomplete, pulled to redo properly. So we redo it right now:
   - Fixed/variable split → structured columns `fixedGrossSalary` + `variableGrossSalary` (Layer B).
   - Equity (stocks/RSUs/warrants, **cross-country**) → `hasEquity` flag + an `equity` catalog benefit holding value/vesting in `EntryBenefit` (e.g. `valueNumeric` = est. annual value, `valueText` = vesting months/notes). No more standalone wide bonus/RSU columns.
