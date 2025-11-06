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

// Rate limiter utilities
export {
    checkRateLimit,
    getClientIp,
    getRemainingRequests,
    resetRateLimit,
} from "./rate-limiter.utils";
export type { RateLimitResult } from "./rate-limiter.utils";

// Entry ownership utilities
export {
    generateOwnerToken,
    getEditableUntilDate,
    getEditStatus,
    getEntryToken,
    getOwnedEntryIds,
    isEntryEditable,
    removeEntryToken,
    storeEntryToken,
} from "./entry-ownership.utils";

// Format utilities
export {
    formatCurrency,
    formatDate,
    formatNumber,
    formatRelativeTime,
    getCurrencySymbol,
} from "./format.utils";

// Export utilities
export { exportToCSV, exportToPDF } from "./export.utils";

// Sorting utilities
export { sortEntries, toggleSortDirection } from "./sorting.utils";

// Pagination utilities
export {
    calculateTotalPages,
    getPaginationInfo,
    normalizePage,
    paginateItems,
} from "./pagination.utils";
