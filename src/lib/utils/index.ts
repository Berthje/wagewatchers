/**
 * Utilities Index
 * Centralized export for all utility functions
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind utility (from original utils.ts)
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Format utilities
export {
    formatCurrency,
    formatDate,
    formatNumber,
    formatRelativeTime,
} from "./format.utils";

// Sorting utilities
export { sortEntries, toggleSortDirection } from "./sorting.utils";

// Pagination utilities
export { calculateTotalPages, paginateItems } from "./pagination.utils";
