/**
 * Sorting Utilities
 * Helper functions for sorting data
 */

import type { SalaryEntry } from "@/lib/db/schema";
import type { SortDirection, SortField } from "@/types/api";

/**
 * Sort salary entries by field and direction
 */
export function sortEntries(
    entries: SalaryEntry[],
    sortField: SortField | null,
    sortDirection: SortDirection,
): SalaryEntry[] {
    if (!sortField || !sortDirection) {
        return entries;
    }

    return [...entries].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
            case "experience":
                aValue = a.workExperience;
                bValue = b.workExperience;
                break;
            case "grossSalary":
                aValue = a.grossSalary;
                bValue = b.grossSalary;
                break;
            case "netSalary":
                aValue = a.netSalary;
                bValue = b.netSalary;
                break;
            case "age":
                aValue = a.age;
                bValue = b.age;
                break;
            case "createdAt":
                aValue = new Date(a.createdAt).getTime();
                bValue = new Date(b.createdAt).getTime();
                break;
            default:
                return 0;
        }

        // Handle null/undefined values
        aValue ??= "";
        bValue ??= "";

        // Compare based on type
        if (typeof aValue === "number" && typeof bValue === "number") {
            return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        } else {
            // String comparison
            const comparison = String(aValue).localeCompare(String(bValue));
            return sortDirection === "asc" ? comparison : -comparison;
        }
    });
}

/**
 * Toggle sort direction
 * asc -> desc -> null
 */
export function toggleSortDirection(
    currentField: SortField | null,
    currentDirection: SortDirection,
    newField: SortField,
): { field: SortField | null; direction: SortDirection } {
    if (currentField === newField) {
        // Toggle direction: asc -> desc -> null
        if (currentDirection === "asc") {
            return { field: newField, direction: "desc" };
        } else if (currentDirection === "desc") {
            return { field: null, direction: null };
        }
    }
    // New field, start with ascending
    return { field: newField, direction: "asc" };
}
