/**
 * Changelog entries for WageWatchers
 * 
 * IMPORTANT: Entries from the past 7 days are automatically sent in the weekly newsletter!
 * 
 * Format:
 * - version: Semantic version (e.g., "1.2.0")
 * - date: ISO date string or readable format (e.g., "2024-11-04" or "November 4, 2024")
 * - changes: Array of change descriptions (user-friendly, avoid technical jargon)
 * 
 * Tips:
 * - Keep descriptions clear and concise
 * - Start with action verbs (Added, Fixed, Improved, Updated)
 * - Order entries newest to oldest
 * - Each change should be one line
 * 
 * // Example entry - delete or modify as needed:
    // {
    //     version: "1.0.0",
    //     date: "2024-11-04",
    //     changes: [
    //         "Added weekly newsletter feature for changelog updates",
    //         "Improved changelog page with back-to-home navigation",
    //         "Separated client and server components for better performance"
    //     ]
    // }
*/
export const changelogEntries: Array<{
    version: string;
    date: string;
    changes: string[];
}> = [];