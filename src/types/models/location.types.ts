/**
 * Location Types
 * Domain models for countries and cities
 */

export interface Location {
    en: string; // English name (canonical/default)
    nl?: string; // Dutch name
    fr?: string; // French name
    de?: string; // German name
}

export interface City {
    en: string; // English name (canonical/default)
    nl?: string; // Dutch name
    fr?: string; // French name
    de?: string; // German name
    aliases?: string[]; // Additional search terms/common misspellings
}

export interface CitySuggestion {
    value: string; // Canonical city name (en)
    label: string; // Localized display name
    score: number; // Match score for fuzzy matching
}
