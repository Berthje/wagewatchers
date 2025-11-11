"use client";

import { useState, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MultiSelect } from "@/components/ui/multi-select";
import { Slider } from "@/components/ui/slider";
import { Filter } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSalaryDisplay } from "@/contexts/salary-display-context";

interface FiltersModalProps {
  // Country filters
  selectedCountries: string[];
  onCountriesChange: (countries: string[]) => void;
  availableCountries: { value: string; label: string }[];

  // City filters
  selectedCities: string[];
  onCitiesChange: (cities: string[]) => void;
  availableCities: { value: string; label: string }[];

  // Sector filters
  selectedSectors: string[];
  onSectorsChange: (sectors: string[]) => void;
  availableSectors: { value: string; label: string }[];

  // Age filters
  minAge?: number | null;
  maxAge?: number | null;
  onMinAgeChange?: (age: number | null) => void;
  onMaxAgeChange?: (age: number | null) => void;
  maxAgeLimit?: number; // Dynamic max value from data

  // Work experience filters
  minWorkExperience?: number | null;
  maxWorkExperience?: number | null;
  onMinWorkExperienceChange?: (experience: number | null) => void;
  onMaxWorkExperienceChange?: (experience: number | null) => void;
  maxWorkExperienceLimit?: number; // Dynamic max value from data

  // Gross salary filters
  minGrossSalary?: number | null;
  maxGrossSalary?: number | null;
  onMinGrossSalaryChange?: (salary: number | null) => void;
  onMaxGrossSalaryChange?: (salary: number | null) => void;
  maxGrossSalaryLimit?: number; // Dynamic max value from data

  // Net salary filters
  minNetSalary?: number | null;
  maxNetSalary?: number | null;
  onMinNetSalaryChange?: (salary: number | null) => void;
  onMaxNetSalaryChange?: (salary: number | null) => void;
  maxNetSalaryLimit?: number; // Dynamic max value from data

  // Active filter count
  activeFilterCount: number;
}

export function FiltersModal({
  selectedCountries,
  onCountriesChange,
  availableCountries,
  selectedCities,
  onCitiesChange,
  availableCities,
  selectedSectors,
  onSectorsChange,
  availableSectors,
  minAge,
  maxAge,
  onMinAgeChange,
  onMaxAgeChange,
  maxAgeLimit = 100,
  minWorkExperience,
  maxWorkExperience,
  onMinWorkExperienceChange,
  onMaxWorkExperienceChange,
  maxWorkExperienceLimit = 50,
  minGrossSalary,
  maxGrossSalary,
  onMinGrossSalaryChange,
  onMaxGrossSalaryChange,
  maxGrossSalaryLimit = 20000,
  minNetSalary,
  maxNetSalary,
  onMinNetSalaryChange,
  onMaxNetSalaryChange,
  maxNetSalaryLimit = 15000,
  activeFilterCount,
}: Readonly<FiltersModalProps>) {
  const t = useTranslations("dashboard");
  const { preferences } = useSalaryDisplay();
  const [open, setOpen] = useState(false);

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

  // Local state for slider values to update UI immediately
  const [localMinAge, setLocalMinAge] = useState(minAge ?? 18);
  const [localMaxAge, setLocalMaxAge] = useState(maxAge ?? maxAgeLimit);
  const [localMinWorkExp, setLocalMinWorkExp] = useState(minWorkExperience ?? 0);
  const [localMaxWorkExp, setLocalMaxWorkExp] = useState(
    maxWorkExperience ?? maxWorkExperienceLimit
  );
  const [localMinGrossSalary, setLocalMinGrossSalary] = useState(minGrossSalary ?? 0);
  const [localMaxGrossSalary, setLocalMaxGrossSalary] = useState(
    maxGrossSalary ?? maxGrossSalaryLimit
  );
  const [localMinNetSalary, setLocalMinNetSalary] = useState(minNetSalary ?? 0);
  const [localMaxNetSalary, setLocalMaxNetSalary] = useState(maxNetSalary ?? maxNetSalaryLimit);

  // Update local state when props change
  useEffect(() => {
    setLocalMinAge(minAge ?? 18);
    setLocalMaxAge(maxAge ?? maxAgeLimit);
  }, [minAge, maxAge, maxAgeLimit]);

  useEffect(() => {
    setLocalMinWorkExp(minWorkExperience ?? 0);
    setLocalMaxWorkExp(maxWorkExperience ?? maxWorkExperienceLimit);
  }, [minWorkExperience, maxWorkExperience, maxWorkExperienceLimit]);

  useEffect(() => {
    setLocalMinGrossSalary(minGrossSalary ?? 0);
    setLocalMaxGrossSalary(maxGrossSalary ?? maxGrossSalaryLimit);
  }, [minGrossSalary, maxGrossSalary, maxGrossSalaryLimit]);

  useEffect(() => {
    setLocalMinNetSalary(minNetSalary ?? 0);
    setLocalMaxNetSalary(maxNetSalary ?? maxNetSalaryLimit);
  }, [minNetSalary, maxNetSalary, maxNetSalaryLimit]);

  // Debounced callbacks for age changes (500ms delay)
  const debouncedAgeChange = useDebouncedCallback((values: number[]) => {
    onMinAgeChange?.(values[0] === 18 ? null : values[0]);
    onMaxAgeChange?.(values[1] === maxAgeLimit ? null : values[1]);
  }, 500);

  // Debounced callbacks for work experience changes (500ms delay)
  const debouncedWorkExpChange = useDebouncedCallback((values: number[]) => {
    onMinWorkExperienceChange?.(values[0] === 0 ? null : values[0]);
    onMaxWorkExperienceChange?.(values[1] === maxWorkExperienceLimit ? null : values[1]);
  }, 500);

  // Debounced callbacks for gross salary changes (500ms delay)
  const debouncedGrossSalaryChange = useDebouncedCallback((values: number[]) => {
    onMinGrossSalaryChange?.(values[0] === 0 ? null : values[0]);
    onMaxGrossSalaryChange?.(values[1] === maxGrossSalaryLimit ? null : values[1]);
  }, 500);

  // Debounced callbacks for net salary changes (500ms delay)
  const debouncedNetSalaryChange = useDebouncedCallback((values: number[]) => {
    onMinNetSalaryChange?.(values[0] === 0 ? null : values[0]);
    onMaxNetSalaryChange?.(values[1] === maxNetSalaryLimit ? null : values[1]);
  }, 500);

  const handleClearAll = () => {
    onCountriesChange([]);
    onCitiesChange([]);
    onSectorsChange([]);
    setLocalMinAge(18);
    setLocalMaxAge(maxAgeLimit);
    setLocalMinWorkExp(0);
    setLocalMaxWorkExp(maxWorkExperienceLimit);
    setLocalMinGrossSalary(0);
    setLocalMaxGrossSalary(maxGrossSalaryLimit);
    setLocalMinNetSalary(0);
    setLocalMaxNetSalary(maxNetSalaryLimit);
    onMinAgeChange?.(null);
    onMaxAgeChange?.(null);
    onMinWorkExperienceChange?.(null);
    onMaxWorkExperienceChange?.(null);
    onMinGrossSalaryChange?.(null);
    onMaxGrossSalaryChange?.(null);
    onMinNetSalaryChange?.(null);
    onMaxNetSalaryChange?.(null);
  };

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="relative bg-stone-800 border-stone-600 text-stone-100 hover:bg-stone-700"
        >
          <Filter className="h-4 w-4 mr-2" />
          {t("filters.filters")}
          {hasActiveFilters && (
            <Badge
              variant="secondary"
              className="ml-2 px-1.5 py-0 h-5 min-w-5 text-xs font-semibold bg-stone-700 text-stone-100"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="h-full max-h-min md:max-h-[75vh] w-full md:w-[80vw] md:max-w-5xl overflow-y-auto bg-stone-800 border-0 rounded-none p-0">
        <DialogHeader className="sticky top-0 bg-stone-800 border-b border-stone-700 px-6 py-4 w-auto z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-stone-100">
              {t("filters.filters")}
            </DialogTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-stone-400 hover:text-stone-100"
              >
                {t("filters.clearAll")}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          {/* Location Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-stone-100 uppercase tracking-wide">
              {t("filters.locationSection")}
            </h3>
            <div className="grid grid-cols-2 gap-4 pl-0">
              <div className="space-y-2">
                <label className="text-sm block font-medium text-stone-300">
                  {t("filters.countries")}
                </label>
                <MultiSelect
                  selectedValues={selectedCountries}
                  onValuesChange={onCountriesChange}
                  options={availableCountries}
                  placeholder={t("filters.allLocations")}
                  searchPlaceholder={t("filters.search")}
                  emptyMessage={t("table.noResults")}
                  selectedLabel={t("filters.locationsSelected")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm block font-medium text-stone-300">
                  {t("filters.cities")}
                </label>
                <MultiSelect
                  selectedValues={selectedCities}
                  onValuesChange={onCitiesChange}
                  options={availableCities}
                  placeholder={t("filters.allCities")}
                  searchPlaceholder={t("filters.search")}
                  emptyMessage={t("table.noResults")}
                  selectedLabel={t("filters.citiesSelected")}
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-stone-700" />

          {/* Work Details Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-stone-100 uppercase tracking-wide">
              {t("filters.workSection")}
            </h3>
            <div className="space-y-2 pl-0">
              <label className="text-sm block font-medium text-stone-300">
                {t("filters.sectors")}
              </label>
              <MultiSelect
                selectedValues={selectedSectors}
                onValuesChange={onSectorsChange}
                options={availableSectors}
                placeholder={t("filters.allSectors")}
                searchPlaceholder={t("filters.search")}
                emptyMessage={t("table.noResults")}
                selectedLabel={t("filters.sectorsSelected")}
              />
            </div>
          </div>

          {/* Age & Work Experience Section */}
          {minAge !== undefined &&
            maxAge !== undefined &&
            onMinAgeChange &&
            onMaxAgeChange &&
            minWorkExperience !== undefined &&
            maxWorkExperience !== undefined &&
            onMinWorkExperienceChange &&
            onMaxWorkExperienceChange && (
              <>
                {/* Divider */}
                <div className="border-t border-stone-700" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Age Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-stone-100 uppercase tracking-wide">
                      {t("filters.ageSection")}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-stone-300">
                          {t("filters.ageRange")}
                        </label>
                        <span className="text-sm text-stone-400">
                          {localMinAge} - {localMaxAge} {t("table.years")}
                        </span>
                      </div>
                      <Slider
                        value={[localMinAge, localMaxAge]}
                        onValueChange={(values) => {
                          setLocalMinAge(values[0]);
                          setLocalMaxAge(values[1]);
                          debouncedAgeChange(values);
                        }}
                        min={18}
                        max={maxAgeLimit}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Work Experience Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-stone-100 uppercase tracking-wide">
                      {t("filters.workExperienceSection")}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-stone-300">
                          {t("filters.workExperienceRange")}
                        </label>
                        <span className="text-sm text-stone-400">
                          {localMinWorkExp} - {localMaxWorkExp} {t("table.years")}
                        </span>
                      </div>
                      <Slider
                        value={[localMinWorkExp, localMaxWorkExp]}
                        onValueChange={(values) => {
                          setLocalMinWorkExp(values[0]);
                          setLocalMaxWorkExp(values[1]);
                          debouncedWorkExpChange(values);
                        }}
                        min={0}
                        max={maxWorkExperienceLimit}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

          {/* Salary Section */}
          {minGrossSalary !== undefined &&
            maxGrossSalary !== undefined &&
            onMinGrossSalaryChange &&
            onMaxGrossSalaryChange &&
            minNetSalary !== undefined &&
            maxNetSalary !== undefined &&
            onMinNetSalaryChange &&
            onMaxNetSalaryChange && (
              <>
                {/* Divider */}
                <div className="border-t border-stone-700" />

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-stone-100 uppercase tracking-wide">
                    {t("filters.salarySection")}
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pl-0">
                    {/* Gross Salary Range */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-stone-300">
                          {t("filters.grossSalaryRange")}
                        </label>
                        <span className="text-sm text-stone-400">
                          {getCurrencySymbol()}
                          {localMinGrossSalary.toLocaleString()} - {getCurrencySymbol()}
                          {localMaxGrossSalary.toLocaleString()}
                        </span>
                      </div>
                      <Slider
                        value={[localMinGrossSalary, localMaxGrossSalary]}
                        onValueChange={(values) => {
                          setLocalMinGrossSalary(values[0]);
                          setLocalMaxGrossSalary(values[1]);
                          debouncedGrossSalaryChange(values);
                        }}
                        min={0}
                        max={maxGrossSalaryLimit}
                        step={100}
                        className="w-full"
                      />
                    </div>

                    {/* Net Salary Range */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-stone-300">
                          {t("filters.netSalaryRange")}
                        </label>
                        <span className="text-sm text-stone-400">
                          {getCurrencySymbol()}
                          {localMinNetSalary.toLocaleString()} - {getCurrencySymbol()}
                          {localMaxNetSalary.toLocaleString()}
                        </span>
                      </div>
                      <Slider
                        value={[localMinNetSalary, localMaxNetSalary]}
                        onValueChange={(values) => {
                          setLocalMinNetSalary(values[0]);
                          setLocalMaxNetSalary(values[1]);
                          debouncedNetSalaryChange(values);
                        }}
                        min={0}
                        max={maxNetSalaryLimit}
                        step={100}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
        </div>

        {/* Footer with summary */}
        <div className="sticky bottom-0 bg-stone-800 pt-4 border-t border-stone-700 px-6 pb-4 z-10">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-400">
              {hasActiveFilters ? (
                <>
                  {activeFilterCount}{" "}
                  {activeFilterCount === 1 ? t("filters.activeFilter") : t("filters.activeFilters")}
                </>
              ) : (
                t("filters.noActiveFilters")
              )}
            </p>
            <Button onClick={() => setOpen(false)}>{t("filters.apply")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
