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
 */
export const changelogEntries: Array<{
    version: string;
    date: string;
    changes: string[];
}> = [
        {
            version: "1.5.0",
            date: "2025-11-04",
            changes: [
                "Added weekly newsletter feature to keep users updated with the latest changes",
                "Enhanced salary entry form with honesty confirmation checkbox for better data quality",
                "Improved city search with better remote work option visibility",
                "Added FMCG sector option with full localization support",
                "Updated sector categories with improved sorting and organization"
            ]
        },
        {
            version: "1.4.0",
            date: "2025-11-03",
            changes: [
                "Added work experience filters to dashboard for better salary insights",
                "Implemented shared filters system between dashboard and statistics pages",
                "Enhanced commute distance handling with improved formatting and validation",
                "Added Slider component for age and experience range selection",
                "Improved SEO with language-specific URLs and metadata",
                "Added redirect from root URL to English homepage for better navigation"
            ]
        },
        {
            version: "1.3.0",
            date: "2025-11-01",
            changes: [
                "Implemented multi-currency support with dynamic currency symbols throughout the platform",
                "Added centralized currency configuration with fallback exchange rates",
                "Enhanced salary display with proper currency formatting in all components",
                "Added Umami analytics for better user tracking and insights",
                "Improved donation page layout with cryptocurrency options and better responsiveness",
                "Added units to age and commute distance labels for clarity"
            ]
        },
        {
            version: "1.2.0",
            date: "2025-10-31",
            changes: [
                "Implemented rate limiting system to prevent abuse (5 submissions per day per IP)",
                "Added entry ownership system allowing anonymous editing with secure tokens",
                "Enhanced content validation to prevent inappropriate submissions and URLs",
                "Added age range filters to both dashboard and statistics pages",
                "Improved robots meta tags to prevent indexing of private pages",
                "Added cohabiting and civil union options to civil status selection"
            ]
        },
        {
            version: "1.1.0",
            date: "2025-10-30",
            changes: [
                "Added comprehensive statistics page with interactive charts and data visualization",
                "Implemented CSV and PDF export functionality for salary statistics",
                "Added new sectors including Pharmaceutical and Public Affairs with full localization",
                "Enhanced form fields with select inputs for day-off ease and stress level",
                "Improved metadata generation with SEO-friendly titles and descriptions",
                "Added language-specific alternate URLs for better SEO"
            ]
        },
        {
            version: "1.0.0",
            date: "2025-10-24",
            changes: [
                "Launched WageWatchers platform with multi-country salary transparency",
                "Implemented automated Reddit scraping for BESalary and NLSalaris communities",
                "Added comprehensive salary entry form with 50+ fields covering work conditions and benefits",
                "Built interactive dashboard with advanced filtering and sorting capabilities",
                "Added admin panel for managing bug reports and user feedback",
                "Implemented multi-language support (English, Dutch, French, German)",
                "Added smart city input with fuzzy matching for location suggestions",
                "Integrated exchange rates system for multi-currency salary data"
            ]
        }
    ];