import { describe, test, expect } from "vitest";
import {
  MIN_V2_ENTRIES,
  MIN_BUCKET,
  countSatisfactionEntries,
  hasEnoughV2Data,
  satisfactionDistribution,
  medianSalaryBySatisfaction,
  satisfactionBySector,
  satisfactionByWorkerType,
  satisfactionByPerk,
  satisfactionByCommute,
  workerTypeMix,
  contractTypeMix,
  fixedVsVariablePay,
  companyCarFuelMix,
  equityAdoption,
  type BeyondPayEntry,
} from "../beyond-pay";

// Identity-ish converter used in tests: currency is ignored, null/undefined → 0.
const convert = (amount: number | null | undefined) => amount ?? 0;

function mk(overrides: Partial<BeyondPayEntry> = {}): BeyondPayEntry {
  return { ...overrides };
}

// Build n entries sharing the same overrides (handy for clearing MIN_BUCKET floors).
function many(n: number, overrides: Partial<BeyondPayEntry>): BeyondPayEntry[] {
  return Array.from({ length: n }, () => mk(overrides));
}

describe("thresholds", () => {
  test("MIN_V2_ENTRIES and MIN_BUCKET are the agreed constants", () => {
    expect(MIN_V2_ENTRIES).toBe(30);
    expect(MIN_BUCKET).toBe(5);
  });
});

describe("countSatisfactionEntries / hasEnoughV2Data (gating)", () => {
  test("counts only entries with a non-null jobSatisfaction", () => {
    const entries = [
      mk({ jobSatisfaction: 7 }),
      mk({ jobSatisfaction: 0 }), // 0 is a valid score, must count
      mk({ jobSatisfaction: null }),
      mk({}), // legacy v1: undefined
    ];
    expect(countSatisfactionEntries(entries)).toBe(2);
  });

  test("gate is closed below the threshold and open at/above it", () => {
    expect(hasEnoughV2Data(many(MIN_V2_ENTRIES - 1, { jobSatisfaction: 8 }))).toBe(false);
    expect(hasEnoughV2Data(many(MIN_V2_ENTRIES, { jobSatisfaction: 8 }))).toBe(true);
  });
});

describe("satisfactionDistribution", () => {
  test("returns all 11 score buckets (0–10) with correct counts, zeros included", () => {
    const entries = [
      mk({ jobSatisfaction: 10 }),
      mk({ jobSatisfaction: 10 }),
      mk({ jobSatisfaction: 7 }),
      mk({ jobSatisfaction: 0 }),
      mk({ jobSatisfaction: null }),
    ];
    const result = satisfactionDistribution(entries);
    expect(result).toHaveLength(11);
    expect(result[0]).toEqual({ score: 0, count: 1 });
    expect(result[7]).toEqual({ score: 7, count: 1 });
    expect(result[10]).toEqual({ score: 10, count: 2 });
    expect(result[3]).toEqual({ score: 3, count: 0 });
  });

  test("empty input yields 11 zero buckets", () => {
    const result = satisfactionDistribution([]);
    expect(result).toHaveLength(11);
    expect(result.every((b) => b.count === 0)).toBe(true);
  });
});

describe("medianSalaryBySatisfaction", () => {
  test("median salary per score, converted, only scores meeting MIN_BUCKET", () => {
    const entries = [
      ...many(MIN_BUCKET, { jobSatisfaction: 8, grossSalary: 4000, currency: "EUR" }),
      // one score-3 entry: below the bucket floor, must be dropped
      mk({ jobSatisfaction: 3, grossSalary: 2000, currency: "EUR" }),
    ];
    const result = medianSalaryBySatisfaction(entries, convert);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ score: 8, medianSalary: 4000, count: MIN_BUCKET });
  });

  test("uses the converter and computes a true median", () => {
    const entries = [
      mk({ jobSatisfaction: 9, grossSalary: 1000, currency: "USD" }),
      mk({ jobSatisfaction: 9, grossSalary: 3000, currency: "USD" }),
      mk({ jobSatisfaction: 9, grossSalary: 5000, currency: "USD" }),
      mk({ jobSatisfaction: 9, grossSalary: 7000, currency: "USD" }),
      mk({ jobSatisfaction: 9, grossSalary: 9000, currency: "USD" }),
    ];
    const doubler = (amount: number | null | undefined) => (amount ?? 0) * 2;
    const result = medianSalaryBySatisfaction(entries, doubler);
    expect(result[0].medianSalary).toBe(10000); // median gross 5000 * 2
  });

  test("ignores entries missing salary", () => {
    const entries = many(MIN_BUCKET, { jobSatisfaction: 6, grossSalary: null });
    expect(medianSalaryBySatisfaction(entries, convert)).toHaveLength(0);
  });
});

describe("satisfactionBySector", () => {
  test("averages satisfaction per sector, drops sub-floor sectors, sorts desc, caps topN", () => {
    const entries = [
      ...many(MIN_BUCKET, { jobSatisfaction: 9, sector: "Tech" }),
      ...many(MIN_BUCKET, { jobSatisfaction: 4, sector: "Retail" }),
      // thin sector — dropped
      mk({ jobSatisfaction: 10, sector: "Mining" }),
    ];
    const result = satisfactionBySector(entries, 8);
    expect(result.map((r) => r.sector)).toEqual(["Tech", "Retail"]);
    expect(result[0]).toMatchObject({ sector: "Tech", avgSatisfaction: 9, count: MIN_BUCKET });
  });

  test("respects the topN cap", () => {
    const entries = [
      ...many(MIN_BUCKET, { jobSatisfaction: 9, sector: "A" }),
      ...many(MIN_BUCKET, { jobSatisfaction: 8, sector: "B" }),
      ...many(MIN_BUCKET, { jobSatisfaction: 7, sector: "C" }),
    ];
    expect(satisfactionBySector(entries, 2).map((r) => r.sector)).toEqual(["A", "B"]);
  });
});

describe("satisfactionByWorkerType", () => {
  test("averages satisfaction per worker type, drops sub-floor types", () => {
    const entries = [
      ...many(MIN_BUCKET, { jobSatisfaction: 8, workerType: "whiteCollar" }),
      mk({ jobSatisfaction: 3, workerType: "freelancer" }), // thin — dropped
    ];
    const result = satisfactionByWorkerType(entries);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ workerType: "whiteCollar", avgSatisfaction: 8 });
  });
});

describe("satisfactionByPerk", () => {
  test("compares with/without company car and equity when both sides meet the floor", () => {
    const entries = [
      ...many(MIN_BUCKET, { jobSatisfaction: 8, hasCompanyCar: true }),
      ...many(MIN_BUCKET, { jobSatisfaction: 6, hasCompanyCar: false }),
      ...many(MIN_BUCKET, { jobSatisfaction: 9, hasEquity: true }),
      ...many(MIN_BUCKET, { jobSatisfaction: 5, hasEquity: false }),
    ];
    const result = satisfactionByPerk(entries);
    const car = result.find((r) => r.perk === "companyCar");
    const equity = result.find((r) => r.perk === "equity");
    expect(car).toMatchObject({ withPerk: 8, withoutPerk: 6 });
    expect(equity).toMatchObject({ withPerk: 9, withoutPerk: 5 });
  });

  test("drops a perk row when either side is below the floor", () => {
    const entries = [
      ...many(MIN_BUCKET, { jobSatisfaction: 8, hasCompanyCar: true }),
      mk({ jobSatisfaction: 6, hasCompanyCar: false }), // without-side too thin
    ];
    expect(satisfactionByPerk(entries).find((r) => r.perk === "companyCar")).toBeUndefined();
  });
});

describe("satisfactionByCommute", () => {
  test("buckets commute minutes into bands and keeps band order", () => {
    const entries = [
      ...many(MIN_BUCKET, { jobSatisfaction: 9, commuteTimeMinutes: 10 }), // 0–15
      ...many(MIN_BUCKET, { jobSatisfaction: 7, commuteTimeMinutes: 20 }), // 15–30
      ...many(MIN_BUCKET, { jobSatisfaction: 5, commuteTimeMinutes: 45 }), // 30–60
      ...many(MIN_BUCKET, { jobSatisfaction: 3, commuteTimeMinutes: 90 }), // 60+
    ];
    const result = satisfactionByCommute(entries);
    expect(result.map((r) => r.band)).toEqual(["0–15", "15–30", "30–60", "60+"]);
    expect(result[0]).toMatchObject({ band: "0–15", avgSatisfaction: 9 });
    expect(result[3]).toMatchObject({ band: "60+", avgSatisfaction: 3 });
  });

  test("drops bands below the floor", () => {
    const entries = [
      ...many(MIN_BUCKET, { jobSatisfaction: 9, commuteTimeMinutes: 10 }),
      mk({ jobSatisfaction: 3, commuteTimeMinutes: 90 }), // thin 60+ band — dropped
    ];
    expect(satisfactionByCommute(entries).map((r) => r.band)).toEqual(["0–15"]);
  });
});

describe("workerTypeMix", () => {
  test("counts and median-pays each worker type, dropping sub-floor types, sorted by count", () => {
    const entries = [
      ...many(MIN_BUCKET + 1, { workerType: "whiteCollar", grossSalary: 4000, currency: "EUR" }),
      ...many(MIN_BUCKET, { workerType: "blueCollar", grossSalary: 3000, currency: "EUR" }),
      mk({ workerType: "intern", grossSalary: 1500 }), // thin — dropped
    ];
    const result = workerTypeMix(entries, convert);
    expect(result.map((r) => r.workerType)).toEqual(["whiteCollar", "blueCollar"]);
    expect(result[0]).toMatchObject({ count: MIN_BUCKET + 1, medianSalary: 4000 });
  });
});

describe("contractTypeMix", () => {
  test("counts and median-pays each contract type, dropping sub-floor types", () => {
    const entries = [
      ...many(MIN_BUCKET, { contractType: "permanent", grossSalary: 4000, currency: "EUR" }),
      mk({ contractType: "interim", grossSalary: 2500 }), // thin — dropped
    ];
    const result = contractTypeMix(entries, convert);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ contractType: "permanent", medianSalary: 4000 });
  });
});

describe("fixedVsVariablePay", () => {
  test("returns an Overall row averaging fixed and variable comp (missing part = 0)", () => {
    const entries = [
      mk({ fixedGrossSalary: 4000, variableGrossSalary: 1000, currency: "EUR" }),
      mk({ fixedGrossSalary: 4000, variableGrossSalary: null, currency: "EUR" }), // variable → 0
    ];
    const result = fixedVsVariablePay(entries, convert);
    const overall = result.find((r) => r.label === "Overall");
    expect(overall).toMatchObject({ avgFixed: 4000, avgVariable: 500 });
  });

  test("ignores entries with neither fixed nor variable comp", () => {
    const entries = [mk({ grossSalary: 3000 }), mk({ fixedGrossSalary: null, variableGrossSalary: null })];
    expect(fixedVsVariablePay(entries, convert)).toHaveLength(0);
  });
});

describe("companyCarFuelMix", () => {
  test("counts fuel types among company-car holders in electric/hybrid/fuel order", () => {
    const entries = [
      ...many(MIN_BUCKET, { hasCompanyCar: true, companyCarFuelType: "electric" }),
      ...many(MIN_BUCKET, { hasCompanyCar: true, companyCarFuelType: "fuel" }),
      mk({ hasCompanyCar: false, companyCarFuelType: "hybrid" }), // no car — ignored
    ];
    const result = companyCarFuelMix(entries);
    expect(result.map((r) => r.fuelType)).toEqual(["electric", "fuel"]);
    expect(result.find((r) => r.fuelType === "electric")?.count).toBe(MIN_BUCKET);
  });
});

describe("equityAdoption", () => {
  test("computes overall adoption percentage and per-worker-type breakdown", () => {
    const entries = [
      ...many(3, { hasEquity: true, workerType: "whiteCollar" }),
      ...many(2, { hasEquity: false, workerType: "whiteCollar" }),
      mk({ hasEquity: null }), // no equity info — excluded from total
    ];
    const result = equityAdoption(entries);
    expect(result.total).toBe(5);
    expect(result.withEquityPct).toBeCloseTo(60);
    const wc = result.byWorkerType.find((w) => w.workerType === "whiteCollar");
    expect(wc).toMatchObject({ count: 5, pct: 60 });
  });

  test("empty input yields zero adoption and no breakdown", () => {
    const result = equityAdoption([]);
    expect(result).toEqual({ withEquityPct: 0, total: 0, byWorkerType: [] });
  });
});
