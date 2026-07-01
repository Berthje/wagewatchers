/**
 * Statistics Types
 * Types for statistics and analytics data
 */

export interface SectorData {
  sector: string;
  count: number;
  avgGross: number;
  medianGross: number;
  totalGross: number;
  salaries: number[];
}

export interface CountryData {
  country: string;
  avgSalary: number;
  medianSalary: number;
  count: number;
  salaries: number[];
}

export interface ExperienceData {
  experience: number;
  avgSalary: number;
  medianSalary: number;
  count: number;
  salaries: number[];
}

export interface SalaryRangeData {
  range: string;
  count: number;
}

export interface AgeData {
  ageGroup: string;
  count: number;
  [key: string]: string | number;
}

export interface ScatterData {
  id: number;
  experience: number;
  salary: number;
  age: number;
  sector: string;
  country: string;
}

export interface YearlyData {
  year: number;
  avgSalary: number;
  count: number;
  medianSalary: number;
}

export interface LocationHeatmapData {
  city: string;
  country: string;
  avgSalary: number;
  medianSalary: number;
  count: number;
  lat?: number;
  lng?: number;
}

// "Beyond Pay" section — statistics built on v2 entry properties
// (satisfaction, worker type, contract type, company car, equity, commute).

export interface SatisfactionBucket {
  score: number;
  count: number;
}

export interface SatisfactionVsPay {
  score: number;
  medianSalary: number;
  count: number;
}

export interface SectorSatisfaction {
  sector: string;
  avgSatisfaction: number;
  count: number;
}

export interface WorkerTypeSatisfaction {
  workerType: string;
  avgSatisfaction: number;
  count: number;
}

export interface PerkSatisfaction {
  perk: "companyCar" | "equity";
  withPerk: number;
  withoutPerk: number;
}

export interface CommuteSatisfaction {
  band: string;
  avgSatisfaction: number;
  count: number;
}

export interface WorkerTypeStat {
  workerType: string;
  count: number;
  medianSalary: number;
}

export interface ContractTypeStat {
  contractType: string;
  count: number;
  medianSalary: number;
}

export interface FixedVariablePay {
  label: string;
  avgFixed: number;
  avgVariable: number;
}

export interface FuelMix {
  fuelType: string;
  count: number;
}

export interface EquityAdoption {
  withEquityPct: number;
  total: number;
  byWorkerType: { workerType: string; pct: number; count: number }[];
}
