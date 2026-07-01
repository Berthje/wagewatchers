/**
 * API Types Index
 * Centralized export for all API-related types
 */

export type {
  SectorData,
  CountryData,
  ExperienceData,
  SalaryRangeData,
  AgeData,
  ScatterData,
  YearlyData,
  LocationHeatmapData,
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
} from "./statistics.types";

// Sorting types for dashboard
export type SortField = "experience" | "grossSalary" | "netSalary" | "age" | "createdAt";
export type SortDirection = "asc" | "desc" | null;
