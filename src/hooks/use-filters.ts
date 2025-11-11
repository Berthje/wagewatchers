"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { SalaryEntry } from "@/lib/db/schema";
import {
  convertCurrency,
  convertPeriod,
  type DisplayCurrency,
  type SalaryPeriod,
} from "@/contexts/salary-display-context";

export interface FilterState {
  selectedCountries: string[];
  selectedSectors: string[];
  selectedCities: string[];
  minAge: number | null;
  maxAge: number | null;
  minWorkExperience: number | null;
  maxWorkExperience: number | null;
  minGrossSalary: number | null;
  maxGrossSalary: number | null;
  minNetSalary: number | null;
  maxNetSalary: number | null;
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
  setMinGrossSalary: (salary: number | null) => void;
  setMaxGrossSalary: (salary: number | null) => void;
  setMinNetSalary: (salary: number | null) => void;
  setMaxNetSalary: (salary: number | null) => void;
  setSearchQuery: (query: string) => void;
  clearAllFilters: () => void;
}

export interface FilterOptions {
  countries: { value: string; label: string }[];
  sectors: { value: string; label: string }[];
  cities: { value: string; label: string }[];
}

export interface MaxFilterValues {
  maxAge: number;
  maxWorkExperience: number;
  maxGrossSalary: number;
  maxNetSalary: number;
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
  maxValues: MaxFilterValues;
}

export function useFilters(
  allEntries: SalaryEntry[],
  initialFilters?: Partial<FilterState>,
  displayCurrency: DisplayCurrency = "EUR",
  displayPeriod: SalaryPeriod = "monthly"
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
  const [minGrossSalary, setMinGrossSalary] = useState<number | null>(
    initialFilters?.minGrossSalary || null
  );
  const [maxGrossSalary, setMaxGrossSalary] = useState<number | null>(
    initialFilters?.maxGrossSalary || null
  );
  const [minNetSalary, setMinNetSalary] = useState<number | null>(
    initialFilters?.minNetSalary || null
  );
  const [maxNetSalary, setMaxNetSalary] = useState<number | null>(
    initialFilters?.maxNetSalary || null
  );
  const [searchQuery, setSearchQuery] = useState<string>(initialFilters?.searchQuery || "");

  // Track previous currency and convert filter values when currency changes
  const previousCurrency = useRef(displayCurrency);

  useEffect(() => {
    const prevCurrency = previousCurrency.current;
    const currentCurrency = displayCurrency;

    // Only convert if currency actually changed
    if (prevCurrency !== currentCurrency) {
      // Convert gross salary filters
      if (minGrossSalary !== null) {
        const converted = Math.round(
          convertCurrency(minGrossSalary, prevCurrency, currentCurrency)
        );
        setMinGrossSalary(converted);
      }
      if (maxGrossSalary !== null) {
        const converted = Math.round(
          convertCurrency(maxGrossSalary, prevCurrency, currentCurrency)
        );
        setMaxGrossSalary(converted);
      }

      // Convert net salary filters
      if (minNetSalary !== null) {
        const converted = Math.round(convertCurrency(minNetSalary, prevCurrency, currentCurrency));
        setMinNetSalary(converted);
      }
      if (maxNetSalary !== null) {
        const converted = Math.round(convertCurrency(maxNetSalary, prevCurrency, currentCurrency));
        setMaxNetSalary(converted);
      }

      // Update the ref for next time
      previousCurrency.current = currentCurrency;
    }
  }, [displayCurrency, minGrossSalary, maxGrossSalary, minNetSalary, maxNetSalary]);

  // Track previous period and convert filter values when period changes
  const previousPeriod = useRef(displayPeriod);

  useEffect(() => {
    const prevPeriod = previousPeriod.current;
    const currentPeriod = displayPeriod;

    // Only convert if period actually changed
    if (prevPeriod !== currentPeriod) {
      // Convert gross salary filters
      if (minGrossSalary !== null) {
        const converted = Math.round(convertPeriod(minGrossSalary, prevPeriod, currentPeriod));
        setMinGrossSalary(converted);
      }
      if (maxGrossSalary !== null) {
        const converted = Math.round(convertPeriod(maxGrossSalary, prevPeriod, currentPeriod));
        setMaxGrossSalary(converted);
      }

      // Convert net salary filters
      if (minNetSalary !== null) {
        const converted = Math.round(convertPeriod(minNetSalary, prevPeriod, currentPeriod));
        setMinNetSalary(converted);
      }
      if (maxNetSalary !== null) {
        const converted = Math.round(convertPeriod(maxNetSalary, prevPeriod, currentPeriod));
        setMaxNetSalary(converted);
      }

      // Update the ref for next time
      previousPeriod.current = currentPeriod;
    }
  }, [displayPeriod, minGrossSalary, maxGrossSalary, minNetSalary, maxNetSalary]);

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

    // Gross salary range filter - convert to display currency and period before comparing
    if (minGrossSalary !== null) {
      filtered = filtered.filter((entry) => {
        if (entry.grossSalary === null) return false;
        // Convert currency first
        let convertedSalary = convertCurrency(entry.grossSalary, entry.currency, displayCurrency);
        // Then convert from monthly (source) to display period
        convertedSalary = convertPeriod(convertedSalary, "monthly", displayPeriod);
        return convertedSalary >= minGrossSalary;
      });
    }
    if (maxGrossSalary !== null) {
      filtered = filtered.filter((entry) => {
        if (entry.grossSalary === null) return false;
        // Convert currency first
        let convertedSalary = convertCurrency(entry.grossSalary, entry.currency, displayCurrency);
        // Then convert from monthly (source) to display period
        convertedSalary = convertPeriod(convertedSalary, "monthly", displayPeriod);
        return convertedSalary <= maxGrossSalary;
      });
    }

    // Net salary range filter - convert to display currency and period before comparing
    if (minNetSalary !== null) {
      filtered = filtered.filter((entry) => {
        if (entry.netSalary === null) return false;
        // Convert currency first
        let convertedSalary = convertCurrency(entry.netSalary, entry.currency, displayCurrency);
        // Then convert from monthly (source) to display period
        convertedSalary = convertPeriod(convertedSalary, "monthly", displayPeriod);
        return convertedSalary >= minNetSalary;
      });
    }
    if (maxNetSalary !== null) {
      filtered = filtered.filter((entry) => {
        if (entry.netSalary === null) return false;
        // Convert currency first
        let convertedSalary = convertCurrency(entry.netSalary, entry.currency, displayCurrency);
        // Then convert from monthly (source) to display period
        convertedSalary = convertPeriod(convertedSalary, "monthly", displayPeriod);
        return convertedSalary <= maxNetSalary;
      });
    }

    // Search query filter (searches across multiple fields)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      // Split by comma and filter out empty keywords
      const keywords = query
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

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
    minGrossSalary,
    maxGrossSalary,
    minNetSalary,
    maxNetSalary,
    searchQuery,
    displayCurrency,
    displayPeriod,
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
      (minGrossSalary === null ? 0 : 1) +
      (maxGrossSalary === null ? 0 : 1) +
      (minNetSalary === null ? 0 : 1) +
      (maxNetSalary === null ? 0 : 1) +
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
    minGrossSalary,
    maxGrossSalary,
    minNetSalary,
    maxNetSalary,
    searchQuery,
  ]);

  // Calculate max values from all entries
  const maxValues = useMemo((): MaxFilterValues => {
    if (allEntries.length === 0) {
      return {
        maxAge: 100,
        maxWorkExperience: 50,
        maxGrossSalary: 20000,
        maxNetSalary: 15000,
      };
    }

    const ages = allEntries.map((e) => e.age).filter((age): age is number => age !== null);
    const workExps = allEntries
      .map((e) => e.workExperience)
      .filter((exp): exp is number => exp !== null);

    // Convert all gross salaries to the display currency and period before finding the max
    const grossSalariesConverted = allEntries
      .filter((e) => e.grossSalary !== null)
      .map((e) => {
        const currencyConverted = convertCurrency(e.grossSalary!, e.currency, displayCurrency);
        return convertPeriod(currencyConverted, "monthly", displayPeriod);
      });

    // Convert all net salaries to the display currency and period before finding the max
    const netSalariesConverted = allEntries
      .filter((e) => e.netSalary !== null)
      .map((e) => {
        const currencyConverted = convertCurrency(e.netSalary!, e.currency, displayCurrency);
        return convertPeriod(currencyConverted, "monthly", displayPeriod);
      });

    return {
      maxAge: ages.length > 0 ? Math.max(...ages) : 100,
      maxWorkExperience: workExps.length > 0 ? Math.max(...workExps) : 50,
      maxGrossSalary:
        grossSalariesConverted.length > 0 ? Math.max(...grossSalariesConverted) : 20000,
      maxNetSalary: netSalariesConverted.length > 0 ? Math.max(...netSalariesConverted) : 15000,
    };
  }, [allEntries, displayCurrency, displayPeriod]);

  // Clear all filters action
  const clearAllFilters = useCallback(() => {
    setSelectedCountries([]);
    setSelectedSectors([]);
    setSelectedCities([]);
    setMinAge(null);
    setMaxAge(null);
    setMinWorkExperience(null);
    setMaxWorkExperience(null);
    setMinGrossSalary(null);
    setMaxGrossSalary(null);
    setMinNetSalary(null);
    setMaxNetSalary(null);
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
    minGrossSalary,
    maxGrossSalary,
    minNetSalary,
    maxNetSalary,
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
    setMinGrossSalary,
    setMaxGrossSalary,
    setMinNetSalary,
    setMaxNetSalary,
    setSearchQuery,
    clearAllFilters,
  };

  return {
    filters,
    actions,
    filteredEntries,
    activeFilterCount,
    options: filterOptions,
    maxValues,
  };
}
