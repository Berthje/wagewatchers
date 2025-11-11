"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { SalaryEntry } from "@/lib/db/schema";
import { useTranslations } from "next-intl";
import { useState, useMemo, useEffect, useCallback } from "react";
import { median } from "d3-array";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Navbar } from "@/components/navbar";
import {
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  User,
  Search,
} from "lucide-react";
import { FiltersModal } from "@/components/filters-modal";
import { ActiveFiltersDisplay } from "@/components/active-filters-display";
import { useFilters } from "@/hooks/use-filters";
import { formatNumber, formatDate } from "@/lib/utils";
import { createCityDisplayFormatter } from "@/lib/utils/format.utils";
import {
  useSalaryDisplay,
  formatSalaryWithPreferences,
  convertCurrency,
  convertPeriod,
} from "@/contexts/salary-display-context";
import type { SortField, SortDirection } from "@/types/api";

export function DashboardClient({
  locale,
}: Readonly<{
  locale: string;
}>) {
  const t = useTranslations("dashboard");
  const tNav = useTranslations("nav");
  const tUi = useTranslations("ui");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { preferences } = useSalaryDisplay();
  const formatCityDisplay = createCityDisplayFormatter(tUi);

  // Initialize filters from URL search params
  const initialFilters = {
    selectedCountries: searchParams.get("countries")?.split(",") || [],
    selectedSectors: searchParams.get("sectors")?.split(",") || [],
    selectedCities: searchParams.get("cities")?.split(",") || [],
    minAge: searchParams.get("minAge") ? Number.parseInt(searchParams.get("minAge")!, 10) : null,
    maxAge: searchParams.get("maxAge") ? Number.parseInt(searchParams.get("maxAge")!, 10) : null,
    minWorkExperience: searchParams.get("minWorkExperience")
      ? Number.parseInt(searchParams.get("minWorkExperience")!, 10)
      : null,
    maxWorkExperience: searchParams.get("maxWorkExperience")
      ? Number.parseInt(searchParams.get("maxWorkExperience")!, 10)
      : null,
    minGrossSalary: searchParams.get("minGrossSalary")
      ? Number.parseInt(searchParams.get("minGrossSalary")!, 10)
      : null,
    maxGrossSalary: searchParams.get("maxGrossSalary")
      ? Number.parseInt(searchParams.get("maxGrossSalary")!, 10)
      : null,
    minNetSalary: searchParams.get("minNetSalary")
      ? Number.parseInt(searchParams.get("minNetSalary")!, 10)
      : null,
    maxNetSalary: searchParams.get("maxNetSalary")
      ? Number.parseInt(searchParams.get("maxNetSalary")!, 10)
      : null,
    searchQuery: searchParams.get("search") || "",
  };

  // Debounced search state (separate from hook for URL sync)
  const [debouncedSearch, setDebouncedSearch] = useState<string>(() => {
    return searchParams.get("search") || "";
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(() => {
    const param = searchParams.get("page");
    return param ? Number.parseInt(param, 10) : 1;
  });
  const [rowsPerPage, setRowsPerPage] = useState<number>(() => {
    const param = searchParams.get("perPage");
    return param ? Number.parseInt(param, 10) : 10;
  });

  // Sorting state
  const [sortField, setSortField] = useState<SortField | null>(() => {
    const param = searchParams.get("sortBy");
    return param as SortField | null;
  });
  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    const param = searchParams.get("sortDir");
    return (param as SortDirection) || null;
  });

  // Mobile detection state
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Data fetching state
  const [entries, setEntries] = useState<SalaryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Use shared filters hook
  const {
    filters,
    actions,
    filteredEntries: filteredByFilters,
    activeFilterCount,
    options,
    maxValues,
  } = useFilters(entries, initialFilters, preferences.currency, preferences.period);

  // Extract filter values for easier access
  const {
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
  } = filters;

  // Extract filter actions
  const {
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
  } = actions;

  // Helper function to get currency symbol
  const getCurrencySymbol = () => {
    switch (preferences.currency) {
      case "USD":
        return "$";
      case "GBP":
        return "£";
      case "EUR":
      default:
        return "€";
    }
  };

  // Sync debounced search to hook
  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch, setSearchQuery]);

  // Fetch entries on mount
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await fetch("/api/entries");
        if (response.ok) {
          const data = await response.json();
          setEntries(data);
        }
      } catch (error) {
        console.error("Failed to fetch entries:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  // Update URL when filters change
  const updateURL = useCallback(
    (updates: {
      countries?: string[];
      sectors?: string[];
      cities?: string[];
      minAge?: number | null;
      maxAge?: number | null;
      minWorkExperience?: number | null;
      maxWorkExperience?: number | null;
      minGrossSalary?: number | null;
      maxGrossSalary?: number | null;
      minNetSalary?: number | null;
      maxNetSalary?: number | null;
      search?: string;
      page?: number;
      perPage?: number;
      sortBy?: SortField | null;
      sortDir?: SortDirection;
    }) => {
      const params = new URLSearchParams(searchParams.toString());

      // Helper to update array parameters
      const updateArrayParam = (key: string, values?: string[]) => {
        if (values !== undefined) {
          if (values.length > 0) {
            params.set(key, values.join(","));
          } else {
            params.delete(key);
          }
        }
      };

      // Helper to update string parameters
      const updateStringParam = (key: string, value?: string | null) => {
        if (value !== undefined) {
          if (value) {
            params.set(key, value);
          } else {
            params.delete(key);
          }
        }
      };

      // Helper to update numeric parameters with defaults
      const updateNumericParam = (key: string, value?: number, defaultValue?: number) => {
        if (value !== undefined) {
          if (value !== defaultValue) {
            params.set(key, value.toString());
          } else {
            params.delete(key);
          }
        }
      };

      // Update all parameters
      updateArrayParam("countries", updates.countries);
      updateArrayParam("sectors", updates.sectors);
      updateArrayParam("cities", updates.cities);
      if (updates.minAge !== undefined) {
        if (updates.minAge === null) {
          params.delete("minAge");
        } else {
          params.set("minAge", updates.minAge.toString());
        }
      }
      if (updates.maxAge !== undefined) {
        if (updates.maxAge === null) {
          params.delete("maxAge");
        } else {
          params.set("maxAge", updates.maxAge.toString());
        }
      }
      if (updates.minWorkExperience !== undefined) {
        if (updates.minWorkExperience === null) {
          params.delete("minWorkExperience");
        } else {
          params.set("minWorkExperience", updates.minWorkExperience.toString());
        }
      }
      if (updates.maxWorkExperience !== undefined) {
        if (updates.maxWorkExperience === null) {
          params.delete("maxWorkExperience");
        } else {
          params.set("maxWorkExperience", updates.maxWorkExperience.toString());
        }
      }
      if (updates.minGrossSalary !== undefined) {
        if (updates.minGrossSalary === null) {
          params.delete("minGrossSalary");
        } else {
          params.set("minGrossSalary", updates.minGrossSalary.toString());
        }
      }
      if (updates.maxGrossSalary !== undefined) {
        if (updates.maxGrossSalary === null) {
          params.delete("maxGrossSalary");
        } else {
          params.set("maxGrossSalary", updates.maxGrossSalary.toString());
        }
      }
      if (updates.minNetSalary !== undefined) {
        if (updates.minNetSalary === null) {
          params.delete("minNetSalary");
        } else {
          params.set("minNetSalary", updates.minNetSalary.toString());
        }
      }
      if (updates.maxNetSalary !== undefined) {
        if (updates.maxNetSalary === null) {
          params.delete("maxNetSalary");
        } else {
          params.set("maxNetSalary", updates.maxNetSalary.toString());
        }
      }
      updateStringParam("search", updates.search);
      updateNumericParam("page", updates.page, 1);
      updateNumericParam("perPage", updates.perPage, 10);
      updateStringParam("sortBy", updates.sortBy);
      updateStringParam("sortDir", updates.sortDir);

      const queryString = params.toString();
      const newURL = queryString ? `${pathname}?${queryString}` : pathname;

      // Use replace to avoid adding to browser history for every filter change
      router.replace(newURL, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // Sync URL with filter state changes
  useEffect(() => {
    updateURL({
      countries: selectedCountries,
      sectors: selectedSectors,
      cities: selectedCities,
      minAge: minAge,
      maxAge: maxAge,
      minWorkExperience: minWorkExperience,
      maxWorkExperience: maxWorkExperience,
      minGrossSalary: minGrossSalary,
      maxGrossSalary: maxGrossSalary,
      minNetSalary: minNetSalary,
      maxNetSalary: maxNetSalary,
      search: debouncedSearch,
      page: currentPage,
      perPage: rowsPerPage,
      sortBy: sortField,
      sortDir: sortDirection,
    });
  }, [
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
    debouncedSearch,
    currentPage,
    rowsPerPage,
    sortField,
    sortDirection,
    updateURL,
  ]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Clear city selections when country filter changes
  useEffect(() => {
    // If cities are selected, check if they're still valid for the selected countries
    if (selectedCities.length > 0 && selectedCountries.length > 0) {
      const validCities = new Set(
        entries
          .filter((e) => selectedCountries.includes(e.country || ""))
          .map((e) => e.workCity)
          .filter(Boolean)
      );

      const stillValidCities = selectedCities.filter((city) => validCities.has(city));

      if (stillValidCities.length !== selectedCities.length) {
        setSelectedCities(stillValidCities);
      }
    }
  }, [selectedCountries, entries, selectedCities, setSelectedCities]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
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
    debouncedSearch,
  ]);

  // Mobile detection
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(globalThis.window.innerWidth < 640); // Tailwind's sm breakpoint
    };

    checkIsMobile();
    globalThis.window.addEventListener("resize", checkIsMobile);

    return () => globalThis.window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Handle column sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      // New field, start with ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Extract filter options for backward compatibility
  // Apply sorting to filtered entries
  const sortedEntries = useMemo(() => {
    if (!sortField || !sortDirection) {
      return filteredByFilters;
    }

    const sorted = [...filteredByFilters].sort((a, b) => {
      // Map sort fields to actual database fields
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "experience":
          aValue = a.workExperience;
          bValue = b.workExperience;
          break;
        case "grossSalary":
          aValue = a.grossSalary;
          bValue = b.grossSalary;
          break;
        case "netSalary":
          aValue = a.netSalary;
          bValue = b.netSalary;
          break;
        case "age":
          aValue = a.age;
          bValue = b.age;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      // Handle null/undefined values
      aValue ??= "";
      bValue ??= "";

      // Compare based on type
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      } else {
        // String comparison
        const comparison = String(aValue).localeCompare(String(bValue));
        return sortDirection === "asc" ? comparison : -comparison;
      }
    });

    return sorted;
  }, [filteredByFilters, sortField, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(sortedEntries.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedEntries = sortedEntries.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Render sort icon helper
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="ml-2 h-4 w-4 shrink-0" />;
    }
    if (sortDirection === "desc") {
      return <ArrowDown className="ml-2 h-4 w-4 shrink-0" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-stone-950 to-stone-900">
      {/* Header */}
      <div className="bg-stone-900 border-b border-stone-700 sticky top-0 z-50">
        <Navbar
          locale={locale}
          translations={{
            dashboard: tNav("dashboard"),
            statistics: tNav("statistics"),
            feedback: tNav("feedback"),
            status: tNav("status"),
            donate: tNav("donate"),
            addEntry: tNav("addEntry"),
            changelog: tNav("changelog"),
          }}
        />
      </div>

      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-stone-100 mb-2">{t("title")}</h1>
            <p className="text-sm md:text-base text-stone-400">
              {t("subtitle", { count: filteredByFilters.length })}
            </p>
          </div>
          <Button
            onClick={() => router.push(`/${locale}/my-entries`)}
            variant="outline"
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <User className="w-4 h-4" />
            <span className="inline">{t("myEntries")}</span>
          </Button>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={`skeleton-${i}`} className="bg-stone-800 border-stone-700">
                <CardHeader>
                  <div className="h-4 bg-stone-700 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-6 bg-stone-700 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            <Card className="bg-stone-800 border-stone-700">
              <CardHeader>
                <CardTitle className="text-xs md:text-sm font-medium text-stone-400">
                  {t("stats.totalEntries")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-stone-100">
                  {formatNumber(filteredByFilters.length)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-stone-800 border-stone-700">
              <CardHeader>
                <CardTitle className="text-xs md:text-sm font-medium text-stone-400">
                  {t("stats.topSector")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="text-xl font-bold text-stone-100 truncate"
                  title={(() => {
                    if (filteredByFilters.length === 0) return "N/A";
                    const sectorCounts = filteredByFilters.reduce(
                      (acc, e) => {
                        const sector = e.sector || "Unknown";
                        acc[sector] = (acc[sector] || 0) + 1;
                        return acc;
                      },
                      {} as Record<string, number>
                    );
                    const topSector = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0];
                    return topSector ? `${topSector[0]} (${topSector[1]})` : "N/A";
                  })()}
                >
                  {(() => {
                    if (filteredByFilters.length === 0) return "N/A";
                    const sectorCounts = filteredByFilters.reduce(
                      (acc, e) => {
                        const sector = e.sector || "Unknown";
                        acc[sector] = (acc[sector] || 0) + 1;
                        return acc;
                      },
                      {} as Record<string, number>
                    );
                    const topSector = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0];
                    return topSector
                      ? `${topSector[0]} (${topSector[1]} ${t("stats.entries")})`
                      : "N/A";
                  })()}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-stone-800 border-stone-700">
              <CardHeader>
                <CardTitle className="text-xs md:text-sm font-medium text-stone-400">
                  {t("stats.medianGrossSalary")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-stone-100">
                  {(() => {
                    if (filteredByFilters.length === 0) return "N/A";
                    const salariesWithCurrency = filteredByFilters
                      .map((e) => ({
                        salary: e.grossSalary,
                        currency: e.currency,
                      }))
                      .filter(
                        (
                          s
                        ): s is {
                          salary: number;
                          currency: string | null;
                        } => s.salary !== null && s.salary !== undefined
                      );
                    if (salariesWithCurrency.length === 0) return "N/A";

                    // Convert all salaries to the display currency and period
                    const convertedSalaries = salariesWithCurrency.map((s) => {
                      const converted = convertCurrency(s.salary, s.currency, preferences.currency);
                      return convertPeriod(converted, "monthly", preferences.period);
                    });

                    // Calculate median using d3-array
                    const medianValue = median(convertedSalaries) ?? 0;

                    return formatSalaryWithPreferences(
                      Math.round(medianValue),
                      preferences.currency,
                      preferences.period === "annual",
                      preferences.currency,
                      preferences.period,
                      locale,
                      isMobile
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-stone-800 border-stone-700">
              <CardHeader>
                <CardTitle className="text-xs md:text-sm font-medium text-stone-400">
                  {t("stats.salaryRange")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-stone-100">
                  {(() => {
                    if (filteredByFilters.length === 0) return "N/A";
                    const salariesWithCurrency = filteredByFilters
                      .map((e) => ({
                        salary: e.grossSalary,
                        currency: e.currency,
                      }))
                      .filter(
                        (
                          s
                        ): s is {
                          salary: number;
                          currency: string | null;
                        } => s.salary !== null && s.salary !== undefined
                      );
                    if (salariesWithCurrency.length === 0) return "N/A";

                    // Convert all salaries to display currency and period for accurate min/max
                    const convertedSalaries = salariesWithCurrency
                      .map((s) => {
                        const currencyConverted = convertCurrency(
                          s.salary,
                          s.currency,
                          preferences.currency
                        );
                        // Convert period (assuming source is monthly)
                        return convertPeriod(currencyConverted, "monthly", preferences.period);
                      })
                      .filter((n) => !Number.isNaN(n));

                    if (convertedSalaries.length === 0) return "N/A";

                    const min = Math.min(...convertedSalaries);
                    const max = Math.max(...convertedSalaries);

                    const minFormatted = formatSalaryWithPreferences(
                      min,
                      preferences.currency,
                      preferences.period === "annual",
                      preferences.currency,
                      preferences.period,
                      locale,
                      isMobile
                    );
                    const maxFormatted = formatSalaryWithPreferences(
                      max,
                      preferences.currency,
                      preferences.period === "annual",
                      preferences.currency,
                      preferences.period,
                      locale,
                      isMobile
                    );

                    return `${minFormatted} - ${maxFormatted}`;
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Entries Table with Integrated Filters */}
        <Card className="bg-stone-800 border-stone-700">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-4">
              {/* Title and Info Row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-stone-100">{t("table.title")}</CardTitle>
                <p className="text-xs md:text-sm text-stone-400 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  {t("table.clickToViewDetails")}
                </p>
              </div>

              {/* Filters and Search Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Filters Modal Button */}
                <FiltersModal
                  selectedCountries={selectedCountries}
                  onCountriesChange={setSelectedCountries}
                  availableCountries={options.countries}
                  selectedCities={selectedCities}
                  onCitiesChange={setSelectedCities}
                  availableCities={options.cities}
                  selectedSectors={selectedSectors}
                  onSectorsChange={setSelectedSectors}
                  availableSectors={options.sectors}
                  minAge={minAge}
                  maxAge={maxAge}
                  onMinAgeChange={setMinAge}
                  onMaxAgeChange={setMaxAge}
                  maxAgeLimit={maxValues.maxAge}
                  minWorkExperience={minWorkExperience}
                  maxWorkExperience={maxWorkExperience}
                  onMinWorkExperienceChange={setMinWorkExperience}
                  onMaxWorkExperienceChange={setMaxWorkExperience}
                  maxWorkExperienceLimit={maxValues.maxWorkExperience}
                  minGrossSalary={minGrossSalary}
                  maxGrossSalary={maxGrossSalary}
                  onMinGrossSalaryChange={setMinGrossSalary}
                  onMaxGrossSalaryChange={setMaxGrossSalary}
                  maxGrossSalaryLimit={maxValues.maxGrossSalary}
                  minNetSalary={minNetSalary}
                  maxNetSalary={maxNetSalary}
                  onMinNetSalaryChange={setMinNetSalary}
                  onMaxNetSalaryChange={setMaxNetSalary}
                  maxNetSalaryLimit={maxValues.maxNetSalary}
                  activeFilterCount={activeFilterCount}
                />

                {/* Search Bar - Takes remaining space */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-500" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("filters.searchPlaceholder")}
                    className="pl-9 bg-stone-700 border-stone-600 text-stone-100 placeholder:text-stone-400"
                  />
                </div>
              </div>

              {/* Active Filters Display */}
              <ActiveFiltersDisplay
                filters={[
                  ...selectedCountries.map((country) => ({
                    id: `country-${country}`,
                    label: country,
                    value: country,
                    category: "country" as const,
                  })),
                  ...selectedCities.map((city) => ({
                    id: `city-${city}`,
                    label: city,
                    value: city,
                    category: "city" as const,
                  })),
                  ...selectedSectors.map((sector) => ({
                    id: `sector-${sector}`,
                    label: sector,
                    value: sector,
                    category: "sector" as const,
                  })),
                  ...(minAge === null
                    ? []
                    : [
                        {
                          id: `min-age-${minAge}`,
                          label: `${t("filters.minAge")}: ${minAge}`,
                          value: minAge.toString(),
                          category: "age" as const,
                        },
                      ]),
                  ...(maxAge === null
                    ? []
                    : [
                        {
                          id: `max-age-${maxAge}`,
                          label: `${t("filters.maxAge")}: ${maxAge}`,
                          value: maxAge.toString(),
                          category: "age" as const,
                        },
                      ]),
                  ...(minWorkExperience === null
                    ? []
                    : [
                        {
                          id: `min-work-experience-${minWorkExperience}`,
                          label: `${t("filters.minWorkExperience")}: ${minWorkExperience}`,
                          value: minWorkExperience.toString(),
                          category: "workExperience" as const,
                        },
                      ]),
                  ...(maxWorkExperience === null
                    ? []
                    : [
                        {
                          id: `max-work-experience-${maxWorkExperience}`,
                          label: `${t("filters.maxWorkExperience")}: ${maxWorkExperience}`,
                          value: maxWorkExperience.toString(),
                          category: "workExperience" as const,
                        },
                      ]),
                  ...(minGrossSalary === null
                    ? []
                    : [
                        {
                          id: `min-gross-salary-${minGrossSalary}`,
                          label: `Min Gross: ${getCurrencySymbol()}${minGrossSalary.toLocaleString()}`,
                          value: minGrossSalary.toString(),
                          category: "grossSalary" as const,
                        },
                      ]),
                  ...(maxGrossSalary === null
                    ? []
                    : [
                        {
                          id: `max-gross-salary-${maxGrossSalary}`,
                          label: `Max Gross: ${getCurrencySymbol()}${maxGrossSalary.toLocaleString()}`,
                          value: maxGrossSalary.toString(),
                          category: "grossSalary" as const,
                        },
                      ]),
                  ...(minNetSalary === null
                    ? []
                    : [
                        {
                          id: `min-net-salary-${minNetSalary}`,
                          label: `Min Net: ${getCurrencySymbol()}${minNetSalary.toLocaleString()}`,
                          value: minNetSalary.toString(),
                          category: "netSalary" as const,
                        },
                      ]),
                  ...(maxNetSalary === null
                    ? []
                    : [
                        {
                          id: `max-net-salary-${maxNetSalary}`,
                          label: `Max Net: ${getCurrencySymbol()}${maxNetSalary.toLocaleString()}`,
                          value: maxNetSalary.toString(),
                          category: "netSalary" as const,
                        },
                      ]),
                ]}
                onRemoveFilter={(value, category) => {
                  if (category === "country") {
                    setSelectedCountries(selectedCountries.filter((c) => c !== value));
                  } else if (category === "city") {
                    setSelectedCities(selectedCities.filter((c) => c !== value));
                  } else if (category === "sector") {
                    setSelectedSectors(selectedSectors.filter((s) => s !== value));
                  } else if (category === "age") {
                    if (minAge !== null && minAge.toString() === value) {
                      setMinAge(null);
                    } else if (maxAge !== null && maxAge.toString() === value) {
                      setMaxAge(null);
                    }
                  } else if (category === "workExperience") {
                    if (minWorkExperience !== null && minWorkExperience.toString() === value) {
                      setMinWorkExperience(null);
                    } else if (
                      maxWorkExperience !== null &&
                      maxWorkExperience.toString() === value
                    ) {
                      setMaxWorkExperience(null);
                    }
                  } else if (category === "grossSalary") {
                    if (minGrossSalary !== null && minGrossSalary.toString() === value) {
                      setMinGrossSalary(null);
                    } else if (maxGrossSalary !== null && maxGrossSalary.toString() === value) {
                      setMaxGrossSalary(null);
                    }
                  } else if (category === "netSalary") {
                    if (minNetSalary !== null && minNetSalary.toString() === value) {
                      setMinNetSalary(null);
                    } else if (maxNetSalary !== null && maxNetSalary.toString() === value) {
                      setMaxNetSalary(null);
                    }
                  }
                }}
                onClearAll={() => {
                  setSelectedCountries([]);
                  setSelectedCities([]);
                  setSelectedSectors([]);
                  setMinAge(null);
                  setMaxAge(null);
                  setMinWorkExperience(null);
                  setMaxWorkExperience(null);
                  setMinGrossSalary(null);
                  setMaxGrossSalary(null);
                  setMinNetSalary(null);
                  setMaxNetSalary(null);
                }}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 bg-stone-800 z-10">
                  <TableRow className="border-stone-700 bg-stone-800">
                    <TableHead className="text-stone-300">
                      <div className="flex items-center h-5">{t("table.location")}</div>
                    </TableHead>
                    <TableHead className="text-stone-300">
                      <div className="flex items-center h-5">{t("table.jobTitle")}</div>
                    </TableHead>
                    <TableHead className="text-stone-300">
                      <div className="flex items-center h-5">{t("table.sector")}</div>
                    </TableHead>
                    <TableHead
                      className="text-stone-300 cursor-pointer hover:bg-stone-800 select-none"
                      onClick={() => handleSort("experience")}
                    >
                      <div className="flex items-center h-5 min-h-5 max-h-5 overflow-hidden">
                        {t("table.experience")}
                        {getSortIcon("experience")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-stone-300 cursor-pointer hover:bg-stone-800 select-none"
                      onClick={() => handleSort("age")}
                    >
                      <div className="flex items-center h-5 min-h-5 max-h-5 overflow-hidden">
                        {t("table.age")}
                        {getSortIcon("age")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-stone-300 cursor-pointer hover:bg-stone-800 select-none"
                      onClick={() => handleSort("grossSalary")}
                    >
                      <div className="flex items-center h-5 min-h-5 max-h-5 overflow-hidden">
                        {t("table.grossSalary")}
                        {getSortIcon("grossSalary")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-stone-300 cursor-pointer hover:bg-stone-800 select-none"
                      onClick={() => handleSort("netSalary")}
                    >
                      <div className="flex items-center h-5 min-h-5 max-h-5 overflow-hidden">
                        {t("table.netSalary")}
                        {getSortIcon("netSalary")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-stone-300 cursor-pointer hover:bg-stone-800 select-none"
                      onClick={() => handleSort("createdAt")}
                    >
                      <div className="flex items-center h-5 min-h-5 max-h-5 overflow-hidden">
                        {t("table.submittedOn")}
                        {getSortIcon("createdAt")}
                      </div>
                    </TableHead>
                    <TableHead className="w-16 text-stone-300">
                      <div className="flex items-center justify-center h-5">
                        {t("table.source")}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: rowsPerPage }).map((_, i) => (
                      <TableRow key={`skeleton-row-${i}`}>
                        <TableCell>
                          <div className="h-4 bg-stone-700 rounded animate-pulse"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-stone-700 rounded animate-pulse"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-stone-700 rounded animate-pulse"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-stone-700 rounded animate-pulse"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-stone-700 rounded animate-pulse"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-stone-700 rounded animate-pulse"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-stone-700 rounded animate-pulse"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-stone-700 rounded animate-pulse"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-stone-700 rounded animate-pulse"></div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredByFilters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-stone-400">
                        {t("table.noResults")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedEntries.map((entry) => (
                      <TableRow
                        key={entry.id}
                        className="border-stone-700 cursor-pointer hover:bg-stone-800/50 transition-all duration-200 group"
                        onClick={() => router.push(`/${locale}/dashboard/${entry.id}`)}
                      >
                        <TableCell className="text-stone-300">
                          <Badge
                            variant="outline"
                            className="border-stone-600 text-stone-300 w-fit"
                          >
                            {entry.country
                              ? formatCityDisplay(entry.country, entry.workCity)
                              : "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-stone-100 group-hover:text-orange-400 transition-colors">
                          <div className="flex items-center gap-2">
                            {entry.jobTitle}
                            <Eye className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </TableCell>
                        <TableCell className="text-stone-300">{entry.sector || "N/A"}</TableCell>
                        <TableCell className="text-stone-300">
                          {entry.workExperience !== null && entry.workExperience !== undefined
                            ? `${entry.workExperience} ${t("table.years")}`
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-stone-300">
                          {entry.age !== null && entry.age !== undefined
                            ? `${entry.age} ${t("table.years")}`
                            : "N/A"}
                        </TableCell>
                        <TableCell className="font-semibold text-stone-100">
                          {formatSalaryWithPreferences(
                            entry.grossSalary,
                            entry.currency,
                            false, // Assuming monthly data
                            preferences.currency,
                            preferences.period,
                            locale,
                            isMobile
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-stone-100">
                          {formatSalaryWithPreferences(
                            entry.netSalary,
                            entry.currency,
                            false, // Assuming monthly data
                            preferences.currency,
                            preferences.period,
                            locale,
                            isMobile
                          )}
                        </TableCell>
                        <TableCell className="text-stone-300 text-sm whitespace-nowrap">
                          {formatDate(entry.createdAt)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="h-7 w-7 flex items-center m-auto">
                            {entry.sourceUrl && (
                              <a
                                href={entry.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center justify-center p-2 hover:bg-stone-700 rounded transition-colors"
                                title={t("table.viewSource")}
                              >
                                <ExternalLink className="h-4 w-4 text-stone-400" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {filteredByFilters.length > 0 && (
              <div className="mt-4 flex flex-col gap-4 border-t border-stone-700 pt-4">
                {/* Results info and rows per page */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-sm text-stone-400">
                    {t("pagination.showing")} {startIndex + 1} {t("pagination.to")}{" "}
                    {Math.min(endIndex, filteredByFilters.length)} {t("pagination.of")}{" "}
                    {formatNumber(filteredByFilters.length)} {t("pagination.results")}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm text-stone-400 whitespace-nowrap">
                      {t("pagination.rowsPerPage")}:
                    </label>
                    <Select
                      value={rowsPerPage.toString()}
                      onValueChange={(value) => {
                        setRowsPerPage(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-20 bg-stone-700 border-stone-600 text-stone-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Page navigation buttons */}
                <div className="flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto pb-2 sm:pb-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="bg-stone-700 border-stone-600 text-stone-100 shrink-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">{t("pagination.previous")}</span>
                  </Button>

                  <div className="flex items-center gap-1 shrink-0">
                    {Array.from(
                      {
                        length: Math.min(totalPages <= 768 ? 3 : 5, totalPages),
                      },
                      (_, i) => {
                        let pageNum;
                        const maxPages = totalPages <= 768 ? 3 : 5;
                        if (totalPages <= maxPages) {
                          pageNum = i + 1;
                        } else if (currentPage <= Math.ceil(maxPages / 2)) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - Math.floor(maxPages / 2)) {
                          pageNum = totalPages - maxPages + 1 + i;
                        } else {
                          pageNum = currentPage - Math.floor(maxPages / 2) + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-8 h-8 sm:w-9 sm:h-9 p-0 text-xs sm:text-sm ${
                              currentPage === pageNum
                                ? "bg-stone-100 text-stone-900"
                                : "bg-stone-700 border-stone-600 text-stone-100"
                            }`}
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="bg-stone-700 border-stone-600 text-stone-100 shrink-0"
                  >
                    <span className="hidden sm:inline mr-1">{t("pagination.next")}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
