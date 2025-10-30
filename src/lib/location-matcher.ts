/**
 * Location (Country/City) matcher utility with fuzzy matching support
 * Helps users find the correct location names even with typos
 */

// Location (Country) with localized names
export interface Location {
    en: string; // English name (canonical/default)
    nl?: string; // Dutch name
    fr?: string; // French name
    de?: string; // German name
}

// Supported locations (countries) with translations
export const LOCATIONS: Record<string, Location> = {
    Belgium: { en: "Belgium", nl: "België", fr: "Belgique", de: "Belgien" },
    Netherlands: {
        en: "Netherlands",
        nl: "Nederland",
        fr: "Pays-Bas",
        de: "Niederlande",
    },
};

// City with localized names for fuzzy matching
export interface City {
    en: string; // English name (canonical/default)
    nl?: string; // Dutch name
    fr?: string; // French name
    de?: string; // German name
    aliases?: string[]; // Additional search terms/common misspellings
}

// Common cities by country with all language variants
// This allows fuzzy matching across all language names
export const COMMON_CITIES: Record<string, City[]> = {
    Belgium: [
        { en: "Aalst", nl: "Aalst", fr: "Alost" },
        { en: "Antwerp", nl: "Antwerpen", fr: "Anvers", de: "Antwerpen" },
        { en: "Arlon", nl: "Aarlen", fr: "Arlon", de: "Arel" },
        {
            en: "Bruges",
            nl: "Brugge",
            fr: "Bruges",
            de: "Brügge",
            aliases: ["Brugs"],
        },
        { en: "Brussels", nl: "Brussel", fr: "Bruxelles", de: "Brüssel" },
        { en: "Charleroi", nl: "Charleroi", fr: "Charleroi" },
        { en: "Ghent", nl: "Gent", fr: "Gand", de: "Gent" },
        { en: "Hasselt", nl: "Hasselt", fr: "Hasselt" },
        { en: "Kortrijk", nl: "Kortrijk", fr: "Courtrai" },
        { en: "Leuven", nl: "Leuven", fr: "Louvain", de: "Löwen" },
        { en: "Liège", nl: "Luik", fr: "Liège", de: "Lüttich" },
        { en: "Mechelen", nl: "Mechelen", fr: "Malines", de: "Mecheln" },
        { en: "Mons", nl: "Bergen", fr: "Mons", de: "Mons" },
        { en: "Namur", nl: "Namen", fr: "Namur", de: "Namür" },
        { en: "Ostend", nl: "Oostende", fr: "Ostende", de: "Ostende" },
        { en: "Tournai", nl: "Doornik", fr: "Tournai", de: "Tournai" },
        { en: "Ypres", nl: "Ieper", fr: "Ypres", de: "Ypern" },
        { en: "Genk", nl: "Genk", fr: "Genk" },
        { en: "La Louvière", nl: "La Louvière", fr: "La Louvière" },
        { en: "Sint-Niklaas", nl: "Sint-Niklaas", fr: "Saint-Nicolas" },
        { en: "Roeselare", nl: "Roeselare", fr: "Roulers" },
        { en: "Wavre", nl: "Waver", fr: "Wavre" },
        { en: "Dendermonde", nl: "Dendermonde", fr: "Termonde" },
        { en: "Turnhout", nl: "Turnhout", fr: "Turnhout" },
        { en: "Mouscron", nl: "Moeskroen", fr: "Mouscron" },
        { en: "Seraing", nl: "Seraing", fr: "Seraing" },
        { en: "Verviers", nl: "Verviers", fr: "Verviers" },
    ],
}; /**
 * Calculate Levenshtein distance between two strings
 * This measures how many single-character edits are needed to change one string into another
 */

function levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1, // insertion
                    matrix[i - 1][j] + 1, // deletion
                );
            }
        }
    }

    return matrix[len1][len2];
}

/**
 * Normalize a string for comparison (lowercase, remove diacritics)
 */
function normalizeString(str: string): string {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics
}

/**
 * Calculate similarity score between two strings (0-1, where 1 is identical)
 */
function similarityScore(str1: string, str2: string): number {
    const norm1 = normalizeString(str1);
    const norm2 = normalizeString(str2);

    // Exact match after normalization
    if (norm1 === norm2) return 1;

    // Check if one starts with the other
    if (norm1.startsWith(norm2) || norm2.startsWith(norm1)) {
        const longer = Math.max(norm1.length, norm2.length);
        const shorter = Math.min(norm1.length, norm2.length);
        return shorter / longer * 0.95; // Slightly lower than exact match
    }

    // Calculate Levenshtein distance
    const distance = levenshteinDistance(norm1, norm2);
    const maxLength = Math.max(norm1.length, norm2.length);

    // Convert distance to similarity (0-1)
    return Math.max(0, 1 - distance / maxLength);
}

export interface CitySuggestion {
    city: string; // The display name in requested locale
    score: number;
    isExactMatch: boolean;
}

/**
 * Get city suggestions based on user input with fuzzy matching
 * Searches across all localized names (English, Dutch, French, German)
 * @param input User's input string
 * @param location Optional location/country to filter cities
 * @param locale Optional locale to prefer (en, nl, fr, de)
 * @param threshold Minimum similarity score to include (default 0.6)
 * @returns Array of city suggestions sorted by relevance
 */
export function getCitySuggestions(
    input: string,
    location?: string,
    locale: string = "en",
    threshold: number = 0.6,
): CitySuggestion[] {
    if (!input || input.trim().length < 2) {
        return [];
    }

    const normalizedInput = normalizeString(input.trim());
    const suggestions: CitySuggestion[] = [];

    // Determine which cities to search
    const citiesToSearch: City[] = [];
    if (location && COMMON_CITIES[location]) {
        citiesToSearch.push(...COMMON_CITIES[location]);
    } else {
        // Search all cities if no location specified
        Object.values(COMMON_CITIES).forEach((cities) => {
            citiesToSearch.push(...cities);
        });
    }

    // Calculate scores for each city (search all localized names)
    for (const cityData of citiesToSearch) {
        let bestScore = 0;
        let isExactMatch = false;

        // Search all language variants
        const namesToCheck: string[] = [cityData.en];
        if (cityData.nl) namesToCheck.push(cityData.nl);
        if (cityData.fr) namesToCheck.push(cityData.fr);
        if (cityData.de) namesToCheck.push(cityData.de);
        if (cityData.aliases) namesToCheck.push(...cityData.aliases);

        // Find the best matching name
        for (const name of namesToCheck) {
            const score = similarityScore(input, name);
            if (score > bestScore) {
                bestScore = score;
            }
            if (normalizeString(name) === normalizedInput) {
                isExactMatch = true;
            }
        }

        // Get the localized display name based on locale
        let displayName = cityData.en; // Default to English
        if (locale === "nl" && cityData.nl) displayName = cityData.nl;
        else if (locale === "fr" && cityData.fr) displayName = cityData.fr;
        else if (locale === "de" && cityData.de) displayName = cityData.de;

        if (bestScore >= threshold) {
            suggestions.push({
                city: displayName,
                score: bestScore,
                isExactMatch,
            });
        }
    }

    // Sort by score (descending)
    suggestions.sort((a, b) => {
        if (a.isExactMatch && !b.isExactMatch) return -1;
        if (!a.isExactMatch && b.isExactMatch) return 1;
        return b.score - a.score;
    });

    // Return top 5 suggestions
    return suggestions.slice(0, 5);
}

/**
 * Get all cities for a specific location/country
 * @param location Location/country name
 * @param locale Optional locale to return localized names (en, nl, fr, de)
 */
export function getCitiesForLocation(
    location: string,
    locale: string = "en",
): string[] {
    const cities = COMMON_CITIES[location] || [];
    return cities.map((city) => {
        if (locale === "nl" && city.nl) return city.nl;
        if (locale === "fr" && city.fr) return city.fr;
        if (locale === "de" && city.de) return city.de;
        return city.en;
    }).sort();
}

/**
 * Get all available cities across all countries
 * @param locale Optional locale to return localized names (en, nl, fr, de)
 */
export function getAllCities(locale: string = "en"): string[] {
    const allCities: string[] = [];
    Object.values(COMMON_CITIES).forEach((cities) => {
        cities.forEach((city) => {
            if (locale === "nl" && city.nl) allCities.push(city.nl);
            else if (locale === "fr" && city.fr) allCities.push(city.fr);
            else if (locale === "de" && city.de) allCities.push(city.de);
            else allCities.push(city.en);
        });
    });
    return [...new Set(allCities)].sort();
}

/**
 * Translate a city name to a specific locale
 * Takes any language variant of a city and returns the localized version
 * @param cityName City name in any language
 * @param targetLocale Target locale (en, nl, fr, de)
 * @returns Localized city name, or original if not found
 */
export function translateCity(
    cityName: string,
    targetLocale: string = "en",
): string {
    if (!cityName) return cityName;

    // Search all cities to find a match
    for (const cities of Object.values(COMMON_CITIES)) {
        for (const city of cities) {
            // Check if the input matches any language variant
            const matches =
                normalizeString(city.en) === normalizeString(cityName) ||
                (city.nl &&
                    normalizeString(city.nl) === normalizeString(cityName)) ||
                (city.fr &&
                    normalizeString(city.fr) === normalizeString(cityName)) ||
                (city.de &&
                    normalizeString(city.de) === normalizeString(cityName)) ||
                (city.aliases?.some(
                    (alias) =>
                        normalizeString(alias) === normalizeString(cityName),
                ));

            if (matches) {
                // Return the localized version
                if (targetLocale === "nl" && city.nl) return city.nl;
                if (targetLocale === "fr" && city.fr) return city.fr;
                if (targetLocale === "de" && city.de) return city.de;
                return city.en;
            }
        }
    }

    // If not found, return original
    return cityName;
}

/**
 * Translate a location (country) name to a specific locale
 * @param locationName Location name in any language
 * @param targetLocale Target locale (en, nl, fr, de)
 * @returns Localized location name, or original if not found
 */
export function translateLocation(
    locationName: string,
    targetLocale: string = "en",
): string {
    if (!locationName) return locationName;

    // Search all locations to find a match
    for (const [key, location] of Object.entries(LOCATIONS)) {
        const matches =
            normalizeString(location.en) === normalizeString(locationName) ||
            (location.nl &&
                normalizeString(location.nl) ===
                normalizeString(locationName)) ||
            (location.fr &&
                normalizeString(location.fr) ===
                normalizeString(locationName)) ||
            (location.de &&
                normalizeString(location.de) ===
                normalizeString(locationName)) ||
            normalizeString(key) === normalizeString(locationName);

        if (matches) {
            // Return the localized version
            if (targetLocale === "nl" && location.nl) return location.nl;
            if (targetLocale === "fr" && location.fr) return location.fr;
            if (targetLocale === "de" && location.de) return location.de;
            return location.en;
        }
    }

    // If not found, return original
    return locationName;
}
