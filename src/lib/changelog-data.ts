/**
 * Task:
 * Read my entire git log and display their date etc so u can decide the date of that feature & Add a new changelog entry (or entries) for recently added features, updates, or improvements that are **visible or relevant to end users**.
 *
 * Rules:
 * - Only include **changes that affect the user experience**, not internal or admin/developer-only updates.
 * - Use clear and friendly language — no technical jargon.
 * - Keep descriptions short and action-oriented (e.g., “Added…”, “Improved…”, “Fixed…”).
 * - Follow this JSON structure:
 *   {
 *     version: "x.x.x",
 *     date: "YYYY-MM-DD",
 *     changes: [
 *       "Added ...",
 *       "Improved ...",
 *       "Fixed ..."
 *     ]
 *   }
 *
 * Examples of valid changes:
 * - “Added dark mode toggle for better visibility at night”
 * - “Improved salary insights with clearer charts and new filtering options”
 * - “Fixed incorrect city names appearing in search results”
 *
 * Do NOT include:
 * - Internal or admin-only features (e.g., “Improved admin panel UI”)
 * - Backend or infrastructure work (e.g., “Refactored API calls”)
 * - Minor layout tweaks or refactors invisible to users
 * - Already existing features / changelog entries. Prevent duplicates.
 *
 * Tip:
 * Make sure the date and version follow the latest entry, and list the newest entries first.
 */
export const changelogEntries: Array<{
  version: string;
  date: string;
  changes: string[];
}> = [
  {
    version: "1.8.2",
    date: "2026-01-20",
    changes: [
      "Improved input fields to accept decimal values for official hours, average hours, vacation days, and telework days for more precise data entry",
      "Added Port sector option with full localization support",
      "Improved job title formatting to properly capitalize titles",
      "Removed year-over-year salary chart from statistics page due to insufficient historical data",
      "Added optional reason field when reporting salary entries for better feedback and clearer reporting",
    ],
  },
  {
    version: "1.8.1",
    date: "2026-01-19",
    changes: [
      "Fixed meal voucher input to properly accept decimal values (e.g., 8.50) instead of restricting to whole numbers",
      "Added HR sector option with full localization support",
      "Added Technology/SaaS sector option with full localization support",
      "Improved SEO with canonical URLs and x-default language tags for better search engine indexing",
      "Fixed work experience validation to allow minimum age of 16 for more accurate data entry",
      "Fixed dashboard filters being lost when opening an entry — returning restores all filters and the same page",
    ],
  },
  {
    version: "1.8.0",
    date: "2025-11-13",
    changes: [
      "Added salary distribution box plot showing quartiles and median values across experience levels for clearer statistical insights",
      "Added tax rate analysis chart to visualize effective tax rates based on gross vs net salary data",
      "Added reporting functionality allowing users to flag inappropriate or suspicious salary entries",
    ],
  },
  {
    version: "1.7.2",
    date: "2025-11-11",
    changes: [
      "Added gross and net salary range filters to the filters modal",
      "Added Chemical and Logistics sector options with full localization support",
    ],
  },
  {
    version: "1.7.1",
    date: "2025-11-10",
    changes: [
      "Improved filter performance with debounced mechanism for smoother interaction",
      "Enhanced interactive world map with hover effects and helpful tooltips for countries without data",
    ],
  },
  {
    version: "1.7.0",
    date: "2025-11-06",
    changes: ["Added interactive world map with salary statistics for enhanced data visualization"],
  },
  {
    version: "1.6.1",
    date: "2025-11-06",
    changes: [
      "Enhanced privacy protection by preventing unauthorized viewing of other users' salary entries",
      "Improved the process for editing salary entries with better error messages and reliability",
      "Simplified the salary entry form by removing unnecessary validation for commute details",
    ],
  },
  {
    version: "1.6.0",
    date: "2025-11-05",
    changes: [
      "Implemented salary entry review system with anomaly detection to automatically flag suspicious submissions for manual review, ensuring data quality by comparing new entries against similar approved ones based on sector, experience, and location",
    ],
  },
  {
    version: "1.5.0",
    date: "2025-11-04",
    changes: [
      "Added weekly newsletter feature to keep users updated with the latest changes",
      "Enhanced salary entry form with honesty confirmation checkbox for better data quality",
      "Improved city search with better remote work option visibility",
      "Added FMCG sector option with full localization support",
      "Updated sector categories with improved sorting and organization",
      'Added localized "Page Not Found" component with custom messages for improved user experience',
    ],
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
      "Added redirect from root URL to English homepage for better navigation",
      "Improved remote work option visibility by placing it at the top of city list",
      "Enhanced UI components with command and popover functionality",
    ],
  },
  {
    version: "1.3.5",
    date: "2025-11-02",
    changes: ["Updated field configuration placeholders for improved clarity"],
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
      "Added units to age and commute distance labels for clarity",
      "Improved layout for crypto donations section with better responsiveness",
      "Updated SVG icons in donation page for enhanced visuals",
      "Enhanced entry detail display with better null value handling and zero commute distance support",
      "Made work city and commute distance fields optional in salary entry form",
    ],
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
      "Added cohabiting and civil union options to civil status selection",
      "Updated city filtering to always show all cities and improved age validation",
      "Removed upvote system from salary entries",
      "Updated navigation buttons to redirect to dashboard instead of going back",
    ],
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
      "Added language-specific alternate URLs for better SEO",
      "Added net salary sorting and average net salary display to dashboard",
      "Replaced dollar sign icon with coins icon and added GitHub link to donation page footer",
    ],
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
      "Integrated exchange rates system for multi-currency salary data",
    ],
  },
];
