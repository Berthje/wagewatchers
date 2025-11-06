"use client";

import { useState, useMemo, useCallback } from "react";
import type { SalaryEntry } from "@/lib/db/schema";

export interface FilterState {
  selectedCountries: string[];
  selectedSectors: string[];
  selectedCities: string[];
  minAge: number | null;
  maxAge: number | null;
  minWorkExperience: number | null;
  maxWorkExperience: number | null;
  searchQuery: string;
}

export interface FilterActions {
  setSelectedCountries: (countries: string[]) => void;
  setSelectedSectors: (sectors: string[]) => void;
  setSelectedCities: (cities: string[]) => void;
  setMinAge: (age: number | null) => void;
  setMaxAge: (age: number | null) => void;
  setMinWorkExperience: (experience: number | null) => void;
  setMaxWorkExperience: (experience: number | null) => void;
  setSearchQuery: (query: string) => void;
  clearAllFilters: () => void;
}

export interface FilterOptions {
  countries: { value: string; label: string }[];
  sectors: { value: string; label: string }[];
  cities: { value: string; label: string }[];
}

export interface UseFiltersReturn {
  // State
  filters: FilterState;

  // Actions
  actions: FilterActions;

  // Computed values
  filteredEntries: SalaryEntry[];
  activeFilterCount: number;
  options: FilterOptions;
}

export function useFilters(
  allEntries: SalaryEntry[],
  initialFilters?: Partial<FilterState>
): UseFiltersReturn {
  // Initialize state with defaults or provided initial values
  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    initialFilters?.selectedCountries || []
  );
  const [selectedSectors, setSelectedSectors] = useState<string[]>(
    initialFilters?.selectedSectors || []
  );
  const [selectedCities, setSelectedCities] = useState<string[]>(
    initialFilters?.selectedCities || []
  );
  const [minAge, setMinAge] = useState<number | null>(initialFilters?.minAge || null);
  const [maxAge, setMaxAge] = useState<number | null>(initialFilters?.maxAge || null);
  const [minWorkExperience, setMinWorkExperience] = useState<number | null>(
    initialFilters?.minWorkExperience || null
  );
  const [maxWorkExperience, setMaxWorkExperience] = useState<number | null>(
    initialFilters?.maxWorkExperience || null
  );
  const [searchQuery, setSearchQuery] = useState<string>(initialFilters?.searchQuery || "");

  // Generate filter options from all entries
  const filterOptions = useMemo((): FilterOptions => {
    const uniqueCountries = Array.from(
      new Set(allEntries.map((entry) => entry.country).filter(Boolean))
    ).sort((a, b) => (a as string).localeCompare(b as string));

    const uniqueSectors = Array.from(
      new Set(allEntries.map((entry) => entry.sector).filter(Boolean))
    ).sort((a, b) => (a as string).localeCompare(b as string));

    const uniqueCities = Array.from(
      new Set(allEntries.map((entry) => entry.workCity).filter(Boolean))
    ).sort((a, b) => (a as string).localeCompare(b as string));

    return {
      countries: uniqueCountries.map((country) => ({
        value: country as string,
        label: country as string,
      })),
      sectors: uniqueSectors.map((sector) => ({
        value: sector as string,
        label: sector as string,
      })),
      cities: uniqueCities.map((city) => ({
        value: city as string,
        label: city as string,
      })),
    };
  }, [allEntries]);

  // Filter entries based on all criteria
  const filteredEntries = useMemo(() => {
    let filtered = allEntries;

    // Country filter
    if (selectedCountries.length > 0) {
      filtered = filtered.filter((entry) => selectedCountries.includes(entry.country || ""));
    }

    // Sector filter
    if (selectedSectors.length > 0) {
      filtered = filtered.filter((entry) => selectedSectors.includes(entry.sector || ""));
    }

    // City filter
    if (selectedCities.length > 0) {
      filtered = filtered.filter((entry) => selectedCities.includes(entry.workCity || ""));
    }

    // Age range filter
    if (minAge !== null) {
      filtered = filtered.filter((entry) => entry.age !== null && entry.age >= minAge);
    }
    if (maxAge !== null) {
      filtered = filtered.filter((entry) => entry.age !== null && entry.age <= maxAge);
    }

    // Work experience range filter
    if (minWorkExperience !== null) {
      filtered = filtered.filter(
        (entry) => entry.workExperience !== null && entry.workExperience >= minWorkExperience
      );
    }
    if (maxWorkExperience !== null) {
      filtered = filtered.filter(
        (entry) => entry.workExperience !== null && entry.workExperience <= maxWorkExperience
      );
    }

    // Search query filter (searches across multiple fields)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      // Split by comma and filter out empty keywords
      const keywords = query.split(',').map(k => k.trim()).filter(k => k.length > 0);

      filtered = filtered.filter((entry) => {
        const searchableFields = [
          entry.jobTitle,
          entry.country,
          entry.sector,
          entry.workCity,
          entry.jobDescription,
        ].filter(Boolean);

        // Check if any keyword matches any field
        for (const keyword of keywords) {
          for (const field of searchableFields) {
            if ((field as string).toLowerCase().includes(keyword)) {
              return true;
            }
          }
        }
        return false;
      });
    }

    return filtered;
  }, [
    allEntries,
    selectedCountries,
    selectedSectors,
    selectedCities,
    minAge,
    maxAge,
    minWorkExperience,
    maxWorkExperience,
    searchQuery,
  ]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    return (
      selectedCountries.length +
      selectedSectors.length +
      selectedCities.length +
      (minAge === null ? 0 : 1) +
      (maxAge === null ? 0 : 1) +
      (minWorkExperience === null ? 0 : 1) +
      (maxWorkExperience === null ? 0 : 1) +
      (searchQuery.trim() ? 1 : 0)
    );
  }, [
    selectedCountries.length,
    selectedSectors.length,
    selectedCities.length,
    minAge,
    maxAge,
    minWorkExperience,
    maxWorkExperience,
    searchQuery,
  ]);

  // Clear all filters action
  const clearAllFilters = useCallback(() => {
    setSelectedCountries([]);
    setSelectedSectors([]);
    setSelectedCities([]);
    setMinAge(null);
    setMaxAge(null);
    setMinWorkExperience(null);
    setMaxWorkExperience(null);
    setSearchQuery("");
  }, []);

  const filters: FilterState = {
    selectedCountries,
    selectedSectors,
    selectedCities,
    minAge,
    maxAge,
    minWorkExperience,
    maxWorkExperience,
    searchQuery,
  };

  const actions: FilterActions = {
    setSelectedCountries,
    setSelectedSectors,
    setSelectedCities,
    setMinAge,
    setMaxAge,
    setMinWorkExperience,
    setMaxWorkExperience,
    setSearchQuery,
    clearAllFilters,
  };

  return {
    filters,
    actions,
    filteredEntries,
    activeFilterCount,
    options: filterOptions,
  };
}
