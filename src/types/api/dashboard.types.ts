/**
 * Dashboard Types
 * Types for dashboard filtering, sorting, and pagination
 */

export type SortField = "experience" | "age" | "grossSalary" | "createdAt";
export type SortDirection = "asc" | "desc" | null;

export interface DashboardFilters {
    selectedCountries: string[];
    selectedSectors: string[];
    selectedCities: string[];
    searchQuery: string;
}

export interface DashboardPagination {
    currentPage: number;
    rowsPerPage: number;
    totalPages: number;
    totalEntries: number;
}

export interface DashboardSort {
    field: SortField | null;
    direction: SortDirection;
}
