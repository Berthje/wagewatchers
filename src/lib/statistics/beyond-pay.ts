/**
 * "Beyond Pay" statistics — aggregations over v2 entry properties
 * (job satisfaction, worker type, contract type, company car, equity, commute).
 *
 * These are pure functions with no React/DOM/context dependencies so they can be
 * unit-tested in isolation. Salary-based aggregations receive a `convert` function
 * from the caller (which owns currency/period preferences) and never convert on
 * their own — that keeps the math pure and deterministic.
 */
import { mean, median } from "d3-array";
import type {
  SatisfactionBucket,
  SatisfactionVsPay,
  SectorSatisfaction,
  WorkerTypeSatisfaction,
  PerkSatisfaction,
  CommuteSatisfaction,
  WorkerTypeStat,
  ContractTypeStat,
  FixedVariablePay,
  FuelMix,
  EquityAdoption,
} from "@/types";

/** Minimum v2 (satisfaction-bearing) entries in the filtered set to reveal the section. */
export const MIN_V2_ENTRIES = 30;
/** Minimum entries for a single bucket (sector, worker type, band…) to be shown. */
export const MIN_BUCKET = 5;

/** Order the 5 fuel types render in for the company-car donut. */
const FUEL_ORDER = ["electric", "hybrid", "fuel"] as const;

/** Converts a raw monthly-EUR-ish salary field to the display value. */
export type SalaryConverter = (
  amount: number | null | undefined,
  currency?: string | null,
) => number;

/**
 * Structural subset of a salary entry this module reads. `SalaryEntry` from the
 * Drizzle schema is assignable to this, so callers pass `SalaryEntry[]` directly.
 */
export interface BeyondPayEntry {
  jobSatisfaction?: number | null;
  workerType?: string | null;
  contractType?: string | null;
  hasCompanyCar?: boolean | null;
  companyCarFuelType?: string | null;
  hasEquity?: boolean | null;
  commuteTimeMinutes?: number | null;
  fixedGrossSalary?: number | null;
  variableGrossSalary?: number | null;
  grossSalary?: number | null;
  sector?: string | null;
  currency?: string | null;
  entryVersion?: number | null;
}

const hasSatisfaction = (e: BeyondPayEntry): e is BeyondPayEntry & { jobSatisfaction: number } =>
  typeof e.jobSatisfaction === "number";

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Count of entries carrying a satisfaction score — the driver of the section gate. */
export function countSatisfactionEntries(entries: BeyondPayEntry[]): number {
  return entries.filter(hasSatisfaction).length;
}

/** Whether the filtered set has enough v2 data to reveal the "Beyond Pay" section. */
export function hasEnoughV2Data(entries: BeyondPayEntry[]): boolean {
  return countSatisfactionEntries(entries) >= MIN_V2_ENTRIES;
}

/** Histogram of satisfaction scores 0–10 (all buckets present, zeros included). */
export function satisfactionDistribution(entries: BeyondPayEntry[]): SatisfactionBucket[] {
  const counts = new Array(11).fill(0) as number[];
  for (const e of entries) {
    if (hasSatisfaction(e) && e.jobSatisfaction >= 0 && e.jobSatisfaction <= 10) {
      counts[Math.round(e.jobSatisfaction)] += 1;
    }
  }
  return counts.map((count, score) => ({ score, count }));
}

/** Median (converted) salary per satisfaction score; scores below the floor are dropped. */
export function medianSalaryBySatisfaction(
  entries: BeyondPayEntry[],
  convert: SalaryConverter,
): SatisfactionVsPay[] {
  const byScore = new Map<number, number[]>();
  for (const e of entries) {
    if (!hasSatisfaction(e) || e.grossSalary == null) continue;
    const score = Math.round(e.jobSatisfaction);
    const list = byScore.get(score) ?? [];
    list.push(convert(e.grossSalary, e.currency));
    byScore.set(score, list);
  }
  return [...byScore.entries()]
    .filter(([, salaries]) => salaries.length >= MIN_BUCKET)
    .map(([score, salaries]) => ({
      score,
      medianSalary: Math.round(median(salaries) ?? 0),
      count: salaries.length,
    }))
    .sort((a, b) => a.score - b.score);
}

/** Average satisfaction per sector — floor-filtered, sorted happiest-first, capped at topN. */
export function satisfactionBySector(
  entries: BeyondPayEntry[],
  topN = 8,
): SectorSatisfaction[] {
  const bySector = new Map<string, number[]>();
  for (const e of entries) {
    if (!hasSatisfaction(e) || !e.sector) continue;
    const list = bySector.get(e.sector) ?? [];
    list.push(e.jobSatisfaction);
    bySector.set(e.sector, list);
  }
  return [...bySector.entries()]
    .filter(([, scores]) => scores.length >= MIN_BUCKET)
    .map(([sector, scores]) => ({
      sector,
      avgSatisfaction: round1(mean(scores) ?? 0),
      count: scores.length,
    }))
    .sort((a, b) => b.avgSatisfaction - a.avgSatisfaction)
    .slice(0, topN);
}

/** Average satisfaction per worker type — floor-filtered, sorted happiest-first. */
export function satisfactionByWorkerType(entries: BeyondPayEntry[]): WorkerTypeSatisfaction[] {
  const byType = new Map<string, number[]>();
  for (const e of entries) {
    if (!hasSatisfaction(e) || !e.workerType) continue;
    const list = byType.get(e.workerType) ?? [];
    list.push(e.jobSatisfaction);
    byType.set(e.workerType, list);
  }
  return [...byType.entries()]
    .filter(([, scores]) => scores.length >= MIN_BUCKET)
    .map(([workerType, scores]) => ({
      workerType,
      avgSatisfaction: round1(mean(scores) ?? 0),
      count: scores.length,
    }))
    .sort((a, b) => b.avgSatisfaction - a.avgSatisfaction);
}

function perkComparison(
  entries: BeyondPayEntry[],
  perk: PerkSatisfaction["perk"],
  flag: (e: BeyondPayEntry) => boolean | null | undefined,
): PerkSatisfaction | null {
  const withScores: number[] = [];
  const withoutScores: number[] = [];
  for (const e of entries) {
    if (!hasSatisfaction(e)) continue;
    const value = flag(e);
    if (value === true) withScores.push(e.jobSatisfaction);
    else if (value === false) withoutScores.push(e.jobSatisfaction);
  }
  if (withScores.length < MIN_BUCKET || withoutScores.length < MIN_BUCKET) return null;
  return {
    perk,
    withPerk: round1(mean(withScores) ?? 0),
    withoutPerk: round1(mean(withoutScores) ?? 0),
  };
}

/** Average satisfaction with vs without company car / equity (rows dropped if a side is thin). */
export function satisfactionByPerk(entries: BeyondPayEntry[]): PerkSatisfaction[] {
  return [
    perkComparison(entries, "companyCar", (e) => e.hasCompanyCar),
    perkComparison(entries, "equity", (e) => e.hasEquity),
  ].filter((row): row is PerkSatisfaction => row !== null);
}

const COMMUTE_BANDS: { band: string; test: (m: number) => boolean }[] = [
  { band: "0–15", test: (m) => m < 15 },
  { band: "15–30", test: (m) => m >= 15 && m < 30 },
  { band: "30–60", test: (m) => m >= 30 && m < 60 },
  { band: "60+", test: (m) => m >= 60 },
];

/** Average satisfaction per commute-time band, in ascending band order, floor-filtered. */
export function satisfactionByCommute(entries: BeyondPayEntry[]): CommuteSatisfaction[] {
  const byBand = new Map<string, number[]>();
  for (const e of entries) {
    if (!hasSatisfaction(e) || e.commuteTimeMinutes == null) continue;
    const band = COMMUTE_BANDS.find((b) => b.test(e.commuteTimeMinutes as number))?.band;
    if (!band) continue;
    const list = byBand.get(band) ?? [];
    list.push(e.jobSatisfaction);
    byBand.set(band, list);
  }
  return COMMUTE_BANDS.map(({ band }) => {
    const scores = byBand.get(band) ?? [];
    return { band, scores };
  })
    .filter(({ scores }) => scores.length >= MIN_BUCKET)
    .map(({ band, scores }) => ({
      band,
      avgSatisfaction: round1(mean(scores) ?? 0),
      count: scores.length,
    }));
}

function categoricalSalaryMix<K extends string>(
  entries: BeyondPayEntry[],
  key: (e: BeyondPayEntry) => string | null | undefined,
  convert: SalaryConverter,
): { value: K; count: number; medianSalary: number }[] {
  const groups = new Map<string, { count: number; salaries: number[] }>();
  for (const e of entries) {
    const value = key(e);
    if (!value) continue;
    const group = groups.get(value) ?? { count: 0, salaries: [] };
    group.count += 1;
    if (e.grossSalary != null) group.salaries.push(convert(e.grossSalary, e.currency));
    groups.set(value, group);
  }
  return [...groups.entries()]
    .filter(([, g]) => g.count >= MIN_BUCKET)
    .map(([value, g]) => ({
      value: value as K,
      count: g.count,
      medianSalary: Math.round(g.salaries.length ? (median(g.salaries) ?? 0) : 0),
    }))
    .sort((a, b) => b.count - a.count);
}

/** Count + median pay per worker type, floor-filtered, sorted by count. */
export function workerTypeMix(
  entries: BeyondPayEntry[],
  convert: SalaryConverter,
): WorkerTypeStat[] {
  return categoricalSalaryMix(entries, (e) => e.workerType, convert).map((r) => ({
    workerType: r.value,
    count: r.count,
    medianSalary: r.medianSalary,
  }));
}

/** Count + median pay per contract type, floor-filtered, sorted by count. */
export function contractTypeMix(
  entries: BeyondPayEntry[],
  convert: SalaryConverter,
): ContractTypeStat[] {
  return categoricalSalaryMix(entries, (e) => e.contractType, convert).map((r) => ({
    contractType: r.value,
    count: r.count,
    medianSalary: r.medianSalary,
  }));
}

/** Average fixed vs variable comp overall; entries with neither part are ignored. */
export function fixedVsVariablePay(
  entries: BeyondPayEntry[],
  convert: SalaryConverter,
): FixedVariablePay[] {
  const qualifying = entries.filter(
    (e) => e.fixedGrossSalary != null || e.variableGrossSalary != null,
  );
  if (qualifying.length === 0) return [];
  const fixed = qualifying.map((e) => convert(e.fixedGrossSalary ?? 0, e.currency));
  const variable = qualifying.map((e) => convert(e.variableGrossSalary ?? 0, e.currency));
  return [
    {
      label: "Overall",
      avgFixed: Math.round(mean(fixed) ?? 0),
      avgVariable: Math.round(mean(variable) ?? 0),
    },
  ];
}

/** Fuel-type counts among company-car holders, in electric/hybrid/fuel order, floor-filtered. */
export function companyCarFuelMix(entries: BeyondPayEntry[]): FuelMix[] {
  const counts = new Map<string, number>();
  for (const e of entries) {
    if (e.hasCompanyCar !== true || !e.companyCarFuelType) continue;
    counts.set(e.companyCarFuelType, (counts.get(e.companyCarFuelType) ?? 0) + 1);
  }
  return FUEL_ORDER.map((fuelType) => ({ fuelType, count: counts.get(fuelType) ?? 0 })).filter(
    (r) => r.count >= MIN_BUCKET,
  );
}

/** Overall equity adoption % plus a per-worker-type breakdown (floor-filtered). */
export function equityAdoption(entries: BeyondPayEntry[]): EquityAdoption {
  const known = entries.filter((e) => e.hasEquity != null);
  const total = known.length;
  const withEquity = known.filter((e) => e.hasEquity === true).length;

  const byType = new Map<string, { count: number; withEquity: number }>();
  for (const e of known) {
    if (!e.workerType) continue;
    const group = byType.get(e.workerType) ?? { count: 0, withEquity: 0 };
    group.count += 1;
    if (e.hasEquity === true) group.withEquity += 1;
    byType.set(e.workerType, group);
  }

  return {
    total,
    withEquityPct: total ? round1((withEquity / total) * 100) : 0,
    byWorkerType: [...byType.entries()]
      .filter(([, g]) => g.count >= MIN_BUCKET)
      .map(([workerType, g]) => ({
        workerType,
        count: g.count,
        pct: round1((g.withEquity / g.count) * 100),
      }))
      .sort((a, b) => b.pct - a.pct),
  };
}
