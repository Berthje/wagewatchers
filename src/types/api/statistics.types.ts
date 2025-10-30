/**
 * Statistics Types
 * Types for statistics and analytics data
 */

export interface SectorData {
    sector: string;
    averageSalary: number;
    count: number;
}

export interface CountryData {
    country: string;
    averageSalary: number;
    count: number;
}

export interface ExperienceData {
    experience: string;
    averageSalary: number;
    count: number;
}

export interface SalaryRangeData {
    range: string;
    count: number;
}

export interface AgeData {
    ageGroup: string;
    averageSalary: number;
    count: number;
}

export interface ScatterData {
    experience: number;
    salary: number;
    sector: string;
    country: string;
    age: number;
    jobTitle?: string;
}

export interface YearlyData {
    year: number;
    month: string;
    averageSalary: number;
    count: number;
}

export interface IndustryInsight {
    sector: string;
    averageSalary: number;
    medianSalary: number;
    minSalary: number;
    maxSalary: number;
    count: number;
    topJobTitles: { title: string; count: number }[];
}

export interface LocationHeatmapData {
    city: string;
    country: string;
    averageSalary: number;
    count: number;
    latitude?: number;
    longitude?: number;
}
