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
} from "./statistics.types";

// Sorting types for dashboard
export type SortField = "experience" | "grossSalary" | "netSalary" | "age" | "createdAt";
export type SortDirection = "asc" | "desc" | null;
