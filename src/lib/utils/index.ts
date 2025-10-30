/**
 * Utilities Index
 * Centralized export for all utility functions
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind utility (from original utils.ts)
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Location utilities
export {
    LOCATIONS,
    COMMON_CITIES,
    findMatchingCities,
    translateLocation,
    translateCity,
    getLocationOptions,
    getCityOptions,
} from './location.utils';

// Rate limiter utilities
export {
    checkRateLimit,
    getRemainingRequests,
    resetRateLimit,
    getClientIp,
} from './rate-limiter.utils';
export type { RateLimitResult } from './rate-limiter.utils';

// Entry ownership utilities
export {
    generateOwnerToken,
    getEditableUntilDate,
    isEntryEditable,
    storeEntryToken,
    getEntryToken,
    getOwnedEntryIds,
    removeEntryToken,
} from './entry-ownership.utils';

// Format utilities
export {
    formatNumber,
    formatCurrency,
    getCurrencySymbol,
    formatDate,
    formatRelativeTime,
} from './format.utils';

// Export utilities
export { exportToCSV, exportToPDF } from './export.utils';
