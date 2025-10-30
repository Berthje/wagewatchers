/**
 * Location Utilities
 * Helper functions for location matching and translation
 */

import { Location, City, CitySuggestion } from "@/types/models";

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

// Common cities by country with all language variants
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
        { en: "Leuven", nl: "Leuven", fr: "Louvain" },
        { en: "Liège", nl: "Luik", fr: "Liège", de: "Lüttich" },
        { en: "Mechelen", nl: "Mechelen", fr: "Malines" },
        { en: "Mons", nl: "Bergen", fr: "Mons" },
        { en: "Namur", nl: "Namen", fr: "Namur" },
        { en: "Ostend", nl: "Oostende", fr: "Ostende" },
        { en: "Roeselare", nl: "Roeselare", fr: "Roulers" },
        { en: "Tournai", nl: "Doornik", fr: "Tournai" },
        { en: "Verviers", nl: "Verviers", fr: "Verviers" },
    ],
    Netherlands: [
        { en: "Amsterdam", nl: "Amsterdam" },
        { en: "Rotterdam", nl: "Rotterdam" },
        { en: "The Hague", nl: "Den Haag", aliases: ["s-Gravenhage"] },
        { en: "Utrecht", nl: "Utrecht" },
        { en: "Eindhoven", nl: "Eindhoven" },
        { en: "Tilburg", nl: "Tilburg" },
        { en: "Groningen", nl: "Groningen" },
        { en: "Almere", nl: "Almere" },
        { en: "Breda", nl: "Breda" },
        { en: "Nijmegen", nl: "Nijmegen" },
        { en: "Enschede", nl: "Enschede" },
        { en: "Haarlem", nl: "Haarlem" },
        { en: "Arnhem", nl: "Arnhem" },
        { en: "Zaanstad", nl: "Zaanstad" },
        { en: "Amersfoort", nl: "Amersfoort" },
    ],
};

/**
 * Calculate Levenshtein distance between two strings for fuzzy matching
 */
function levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1,
                );
            }
        }
    }

    return matrix[len1][len2];
}

/**
 * Calculate match score (0-1, higher is better)
 */
function calculateMatchScore(input: string, target: string): number {
    const inputLower = input.toLowerCase();
    const targetLower = target.toLowerCase();

    // Exact match
    if (inputLower === targetLower) return 1.0;

    // Starts with
    if (targetLower.startsWith(inputLower)) return 0.9;

    // Contains
    if (targetLower.includes(inputLower)) return 0.7;

    // Levenshtein distance based score
    const distance = levenshteinDistance(inputLower, targetLower);
    const maxLength = Math.max(inputLower.length, targetLower.length);
    const score = 1 - distance / maxLength;

    return score > 0.5 ? score : 0; // Only return if score is reasonable
}

/**
 * Find matching cities with fuzzy matching
 */
export function findMatchingCities(
    query: string,
    country: string,
    locale: string,
    maxResults: number = 10,
): CitySuggestion[] {
    const cities = COMMON_CITIES[country] || [];
    const results: CitySuggestion[] = [];

    for (const city of cities) {
        // Check all language variants
        const variants = [
            { name: city.en, lang: "en" },
            { name: city.nl, lang: "nl" },
            { name: city.fr, lang: "fr" },
            { name: city.de, lang: "de" },
            ...(city.aliases || []).map((alias) => ({
                name: alias,
                lang: "alias",
            })),
        ];

        let bestScore = 0;
        let bestVariant = city.en;

        for (const variant of variants) {
            if (!variant.name) continue;

            const score = calculateMatchScore(query, variant.name);
            if (score > bestScore) {
                bestScore = score;
                bestVariant = variant.name;
            }
        }

        if (bestScore > 0) {
            // Get localized display name
            const localizedName =
                locale === "nl" && city.nl ? city.nl
                    : locale === "fr" && city.fr ? city.fr
                        : locale === "de" && city.de ? city.de
                            : city.en;

            results.push({
                value: city.en, // Always use English as canonical value
                label: localizedName,
                score: bestScore,
            });
        }
    }

    // Sort by score and return top results
    return results
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);
}

/**
 * Translate location (country) name to locale
 */
export function translateLocation(
    locationName: string,
    locale: string,
): string {
    // Find location in LOCATIONS
    for (const [, location] of Object.entries(LOCATIONS)) {
        if (
            location.en === locationName ||
            location.nl === locationName ||
            location.fr === locationName ||
            location.de === locationName
        ) {
            // Return localized name
            if (locale === "nl" && location.nl) return location.nl;
            if (locale === "fr" && location.fr) return location.fr;
            if (locale === "de" && location.de) return location.de;
            return location.en; // Default to English
        }
    }

    // If not found, return as-is
    return locationName;
}

/**
 * Translate city name to locale
 */
export function translateCity(cityName: string, locale: string): string {
    // Search all countries for the city
    for (const cities of Object.values(COMMON_CITIES)) {
        const city = cities.find(
            (c) =>
                c.en === cityName ||
                c.nl === cityName ||
                c.fr === cityName ||
                c.de === cityName,
        );

        if (city) {
            // Return localized name
            if (locale === "nl" && city.nl) return city.nl;
            if (locale === "fr" && city.fr) return city.fr;
            if (locale === "de" && city.de) return city.de;
            return city.en; // Default to English
        }
    }

    // If not found, return as-is
    return cityName;
}

/**
 * Get all locations (countries) as options
 */
export function getLocationOptions(
    locale: string,
): { value: string; label: string }[] {
    return Object.entries(LOCATIONS).map(([_key, location]) => ({
        value: location.en, // Use English as canonical value
        label: translateLocation(location.en, locale),
    }));
}

/**
 * Get all cities for a country as options
 */
export function getCityOptions(
    country: string,
    locale: string,
): { value: string; label: string }[] {
    const cities = COMMON_CITIES[country] || [];
    return cities.map((city) => ({
        value: city.en, // Use English as canonical value
        label: translateCity(city.en, locale),
    }));
}
