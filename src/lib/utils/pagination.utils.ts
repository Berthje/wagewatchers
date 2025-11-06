/**
 * Pagination Utilities
 * Helper functions for pagination logic
 */

/**
 * Paginate an array of items
 */
export function paginateItems<T>(
    items: T[],
    page: number,
    itemsPerPage: number,
): T[] {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
}

/**
 * Calculate total pages
 */
export function calculateTotalPages(
    totalItems: number,
    itemsPerPage: number,
): number {
    return Math.ceil(totalItems / itemsPerPage);
}

/**
 * Get pagination info
 */
export function getPaginationInfo(
    totalItems: number,
    currentPage: number,
    itemsPerPage: number,
) {
    const totalPages = calculateTotalPages(totalItems, itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalItems);
    const hasPrevious = currentPage > 1;
    const hasNext = currentPage < totalPages;

    return {
        totalPages,
        startIndex,
        endIndex,
        hasPrevious,
        hasNext,
    };
}

/**
 * Validate and normalize page number
 */
export function normalizePage(
    page: number,
    totalPages: number,
): number {
    if (page < 1) return 1;
    if (page > totalPages) return Math.max(1, totalPages);
    return page;
}
