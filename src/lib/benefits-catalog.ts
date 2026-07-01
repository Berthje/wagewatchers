/**
 * Benefits catalog — the single source of truth for the structured benefits we
 * capture per entry. Consumed by:
 *   - the seed script that fills the `BenefitDefinition` table (data, not schema)
 *   - the salary form's benefits multi-select (country + worker-type aware)
 *
 * Adding a benefit (or a new country's benefit) is a row here — never a schema
 * migration. This is the deliberate fix for the reverted wide bonus/RSU columns.
 *
 * Pure TS — no Drizzle import, so it is safe to bundle on the client.
 */

export type BenefitCategory =
  | "cash"
  | "equity"
  | "insurance"
  | "mobility"
  | "timeOff"
  | "retirement"
  | "other";

export type BenefitValueType = "boolean" | "amount" | "percent" | "enum" | "text";

export type WorkerType = "whiteCollar" | "blueCollar" | "freelancer" | "intern" | "phdResearcher";

export interface BenefitDefinition {
  /** Stable key — matches EntryBenefit.benefitKey and the i18n label key. */
  key: string;
  category: BenefitCategory;
  valueType: BenefitValueType;
  /** ISO country codes this applies to; omitted = universal. */
  countries?: string[];
  /** Worker types this applies to; omitted = all. */
  workerTypes?: WorkerType[];
  /** Options for `enum` benefits (also used to seed the form select). */
  options?: string[];
  /**
   * Unit hint for `amount` benefits (per the i18n unit label key).
   * "days" marks a day-count amount (NOT money) so the form omits the currency symbol.
   */
  unit?: "perMonth" | "perYear" | "perDay" | "days";
  /** What `valueText` is meant to hold, for the form helper (vesting, frequency…). */
  detailHint?: string;
}

// Worker types that receive classic employee benefits (everyone except freelancers).
const EMPLOYEE_TYPES: WorkerType[] = ["whiteCollar", "blueCollar", "intern", "phdResearcher"];

// Benefits that also have a dedicated column + form field on SalaryEntry. They
// are part of the catalog (so the BenefitDefinition table is complete and the
// API can dual-write them as EntryBenefit rows), but the form's benefits
// multi-select hides them because they have their own inputs.
export const COLUMN_BACKED_BENEFIT_KEYS = [
  "mealVouchers",
  "ecoCheques",
  "thirteenthMonth",
  "groupInsurance",
] as const;

export const BENEFIT_DEFINITIONS: BenefitDefinition[] = [
  // ── Universal cash / variable pay ───────────────────────────────────────────
  {
    key: "bonus",
    category: "cash",
    valueType: "amount",
    unit: "perYear",
    detailHint: "frequency + type (e.g. annual, performance-based, discretionary)",
  },
  {
    key: "thirteenthMonth",
    category: "cash",
    valueType: "enum",
    options: ["full", "partial", "none"],
    workerTypes: EMPLOYEE_TYPES,
  },
  {
    key: "salaryIncreaseFrequency",
    category: "other",
    valueType: "enum",
    options: ["none", "yearly", "everyTwoYears", "adHoc"],
  },
  // ── Equity (cross-country, NOT US-only) ─────────────────────────────────────
  {
    key: "equity",
    category: "equity",
    valueType: "amount",
    unit: "perYear",
    detailHint: "instrument (RSU/options/warrants/stock) + vesting schedule in months",
  },
  // ── Insurance ───────────────────────────────────────────────────────────────
  { key: "hospitalizationInsurance", category: "insurance", valueType: "boolean" },
  { key: "dentalInsurance", category: "insurance", valueType: "boolean" },
  { key: "ambulatoryInsurance", category: "insurance", valueType: "boolean" },
  { key: "guaranteedIncomeInsurance", category: "insurance", valueType: "boolean" }, // salary-loss
  // ── Retirement ───────────────────────────────────────────────────────────────
  {
    key: "pensionPlan",
    category: "retirement",
    valueType: "amount",
    unit: "perYear",
    detailHint: "employer contribution / plan type",
  },
  // ── Equipment / remote ───────────────────────────────────────────────────────
  { key: "phone", category: "other", valueType: "boolean" },
  { key: "laptop", category: "other", valueType: "boolean" },
  { key: "internetAllowance", category: "cash", valueType: "amount", unit: "perMonth" },
  { key: "homeworkingAllowance", category: "cash", valueType: "amount", unit: "perMonth" },
  // ── Time off ──────────────────────────────────────────────────────────────────
  { key: "extraLeaveDays", category: "timeOff", valueType: "amount", unit: "days" },
  // Training / development budget (NLSalaris "opleidingsmogelijkheden") — universal.
  { key: "trainingBudget", category: "other", valueType: "amount", unit: "perYear" },
  // Company bike / lease bike and free/*reimbursed* public transport exist in both
  // BE and NL ("fiets van de zaak", "gratis OV") — universal.
  { key: "bikeLease", category: "mobility", valueType: "boolean" },
  { key: "publicTransportReimbursement", category: "mobility", valueType: "boolean" },
  // ── Free-text catch-all ────────────────────────────────────────────────────────
  { key: "other", category: "other", valueType: "text" },

  // ── Belgium-specific ───────────────────────────────────────────────────────────
  {
    key: "mealVouchers",
    category: "cash",
    valueType: "amount",
    unit: "perDay",
    countries: ["BE"],
    workerTypes: EMPLOYEE_TYPES,
  },
  {
    key: "ecoCheques",
    category: "cash",
    valueType: "amount",
    unit: "perYear",
    countries: ["BE"],
    workerTypes: EMPLOYEE_TYPES,
  },
  {
    key: "groupInsurance",
    category: "retirement",
    valueType: "boolean",
    countries: ["BE"],
    workerTypes: EMPLOYEE_TYPES,
  },
  { key: "cafeteriaPlan", category: "cash", valueType: "boolean", countries: ["BE"] },
  {
    key: "mobilityBudget",
    category: "mobility",
    valueType: "amount",
    unit: "perYear",
    countries: ["BE"],
  },
  {
    key: "netExpenseAllowance", // onkostenvergoeding
    category: "cash",
    valueType: "amount",
    unit: "perMonth",
    countries: ["BE"],
  },
  {
    key: "ipCopyrightRemuneration", // auteursrechten — common in IT
    category: "cash",
    valueType: "amount",
    unit: "perYear",
    countries: ["BE"],
    workerTypes: ["whiteCollar", "freelancer"],
  },
  {
    key: "advDays", // arbeidsduurvermindering
    category: "timeOff",
    valueType: "amount",
    unit: "days",
    countries: ["BE"],
    workerTypes: EMPLOYEE_TYPES,
  },

  // ── Netherlands-specific ─────────────────────────────────────────────────────
  {
    key: "vakantiegeld8pct", // mandatory 8% holiday allowance
    category: "cash",
    valueType: "boolean",
    countries: ["NL"],
    workerTypes: EMPLOYEE_TYPES,
  },
  {
    key: "eindejaarsuitkering", // 13th month / end-of-year bonus
    category: "cash",
    valueType: "enum",
    options: ["full", "partial", "none"],
    countries: ["NL"],
    workerTypes: EMPLOYEE_TYPES,
  },
  {
    key: "thirtyPercentRuling", // 30%-ruling expat tax benefit
    category: "cash",
    valueType: "boolean",
    countries: ["NL"],
  },
  {
    key: "pensioenregeling", // pension scheme
    category: "retirement",
    valueType: "boolean",
    countries: ["NL"],
    workerTypes: EMPLOYEE_TYPES,
  },
  {
    key: "reiskostenvergoeding", // travel allowance
    category: "mobility",
    valueType: "amount",
    unit: "perMonth",
    countries: ["NL"],
  },
  {
    key: "thuiswerkvergoeding", // home-work allowance
    category: "cash",
    valueType: "amount",
    unit: "perMonth",
    countries: ["NL"],
  },
];

/**
 * Benefits available for a given country + worker type. By default excludes
 * column-backed benefits (they have dedicated form fields); pass
 * `includeColumnBacked` for seeding/analytics that need the full set.
 */
export function getBenefitsFor(
  country: string | undefined,
  workerType: string | undefined,
  opts: { includeColumnBacked?: boolean } = {}
) {
  const cc = countryToCode(country);
  const columnBacked = new Set<string>(COLUMN_BACKED_BENEFIT_KEYS);
  return BENEFIT_DEFINITIONS.filter((b) => {
    if (!opts.includeColumnBacked && columnBacked.has(b.key)) return false;
    const countryOk = !b.countries || (cc !== undefined && b.countries.includes(cc));
    const workerOk =
      !b.workerTypes ||
      (workerType !== undefined && b.workerTypes.includes(workerType as WorkerType));
    return countryOk && workerOk;
  });
}

/** Map a display country name to an ISO code used by the catalog. */
export function countryToCode(country: string | undefined): string | undefined {
  if (!country) return undefined;
  const map: Record<string, string> = {
    Belgium: "BE",
    Netherlands: "NL",
    Germany: "DE",
    France: "FR",
    "United States": "US",
  };
  return map[country] ?? country;
}
