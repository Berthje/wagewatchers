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
