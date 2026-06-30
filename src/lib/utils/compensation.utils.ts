import type { SalaryEntry } from "@/lib/db/schema";

/**
 * Worker types don't all report a monthly gross/net: freelancers have a day
 * rate, blue-collar an hourly rate, PhD researchers a bursary. This returns the
 * primary headline figure to show (so lists don't render a misleading "N/A").
 *
 * `kind` tells the caller how to format: "monthly" amounts go through the normal
 * currency/period formatter; "rate" amounts are shown as-is with a unit suffix.
 */
export type PrimaryComp =
  | { kind: "monthly"; amount: number; labelKey: string }
  | { kind: "rate"; amount: number; unitKey: "perDay" | "perHour"; labelKey: string }
  | null;

export function getPrimaryComp(
  entry: Pick<
    SalaryEntry,
    | "workerType"
    | "grossSalary"
    | "netSalary"
    | "netCompensation"
    | "dayRate"
    | "hourlyRate"
    | "bursaryAmount"
    | "virtualGrossSalary"
  >
): PrimaryComp {
  const wt = entry.workerType ?? "whiteCollar";

  if (wt === "freelancer" && entry.dayRate != null) {
    return { kind: "rate", amount: entry.dayRate, unitKey: "perDay", labelKey: "dayRate" };
  }
  if (wt === "blueCollar" && entry.hourlyRate != null) {
    return { kind: "rate", amount: entry.hourlyRate, unitKey: "perHour", labelKey: "hourlyRate" };
  }
  if (wt === "phdResearcher") {
    if (entry.bursaryAmount != null)
      return { kind: "monthly", amount: entry.bursaryAmount, labelKey: "bursary" };
    if (entry.virtualGrossSalary != null)
      return { kind: "monthly", amount: entry.virtualGrossSalary, labelKey: "virtualGross" };
  }
  // Salaried (and any fallback): prefer gross, then net, then net comp.
  if (entry.grossSalary != null)
    return { kind: "monthly", amount: entry.grossSalary, labelKey: "grossSalary" };
  if (entry.netSalary != null)
    return { kind: "monthly", amount: entry.netSalary, labelKey: "netSalary" };
  if (entry.netCompensation != null)
    return { kind: "monthly", amount: entry.netCompensation, labelKey: "netCompensation" };
  return null;
}

type PackageEntry = Pick<
  SalaryEntry,
  | "workerType"
  | "currency"
  | "grossSalary"
  | "dayRate"
  | "hourlyRate"
  | "bursaryAmount"
  | "virtualGrossSalary"
  | "thirteenthMonth"
  | "mealVouchers"
  | "ecoCheques"
>;

// Rough working-days/hours per year for rate-based annualisation (BE/NL norms).
const WORK_DAYS_PER_YEAR = 220;
const WORK_HOURS_PER_YEAR = 1700;

/**
 * Estimate an entry's *annual total cash package* in EUR — a fuller, more
 * realistic comparison base than gross alone. Uses only columns present on the
 * entry: base pay (worker-type aware) + 13th month + meal vouchers + eco-cheques.
 * `toEUR` converts an amount from the entry's currency to EUR.
 * Returns null when there isn't enough to estimate a base.
 */
export function estimateAnnualPackageEUR(
  entry: PackageEntry,
  toEUR: (amount: number, currency: string | null) => number
): number | null {
  const wt = entry.workerType ?? "whiteCollar";
  const cur = entry.currency;
  let annual: number | null = null;

  if (wt === "freelancer" && entry.dayRate != null) {
    annual = toEUR(entry.dayRate, cur) * WORK_DAYS_PER_YEAR;
  } else if (wt === "blueCollar" && entry.hourlyRate != null) {
    annual = toEUR(entry.hourlyRate, cur) * WORK_HOURS_PER_YEAR;
  } else if (wt === "phdResearcher" && (entry.bursaryAmount ?? entry.virtualGrossSalary) != null) {
    annual = toEUR((entry.bursaryAmount ?? entry.virtualGrossSalary)!, cur) * 12;
  } else if (entry.grossSalary != null) {
    annual = toEUR(entry.grossSalary, cur) * 12;
  }
  if (annual == null) return null;

  // Employee extras layered on top of base pay.
  const grossMonthlyEUR = entry.grossSalary != null ? toEUR(entry.grossSalary, cur) : 0;
  if (entry.thirteenthMonth === "Full") annual += grossMonthlyEUR;
  else if (entry.thirteenthMonth === "Partial") annual += grossMonthlyEUR * 0.5;
  if (entry.mealVouchers != null) annual += toEUR(entry.mealVouchers, cur) * WORK_DAYS_PER_YEAR;
  if (entry.ecoCheques != null) annual += toEUR(entry.ecoCheques, cur);

  return Math.round(annual);
}
