"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import { Filter } from "lucide-react";
import { useTranslations } from "next-intl";

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
    activeFilterCount,
}: Readonly<FiltersModalProps>) {
    const t = useTranslations("dashboard");
    const [open, setOpen] = useState(false);

    const handleClearAll = () => {
        onCountriesChange([]);
        onCitiesChange([]);
        onSectorsChange([]);
        onMinAgeChange?.(null);
        onMaxAgeChange?.(null);
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
                            className="ml-2 px-1.5 py-0 h-5 min-w-[20px] text-xs font-semibold bg-stone-700 text-stone-100"
                        >
                            {activeFilterCount}
                        </Badge>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-stone-800 border-stone-700">
                <DialogHeader className="sticky top-0 bg-stone-800 pb-4 border-b border-stone-700">
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

                <div className="space-y-6 pt-4">
                    {/* Location Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-stone-100 uppercase tracking-wide">
                            {t("filters.locationSection")}
                        </h3>
                        <div className="space-y-4 pl-0">
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
                                    selectedLabel={t(
                                        "filters.locationsSelected"
                                    )}
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

                    {/* Age Section */}
                    {minAge !== undefined && maxAge !== undefined && onMinAgeChange && onMaxAgeChange && (
                        <>
                            {/* Divider */}
                            <div className="border-t border-stone-700" />

                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-stone-100 uppercase tracking-wide">
                                    {t("filters.ageSection")}
                                </h3>
                                <div className="grid grid-cols-2 gap-4 pl-0">
                                    <div className="space-y-2">
                                        <label className="text-sm block font-medium text-stone-300">
                                            {t("filters.minAge")}
                                        </label>
                                        <Input
                                            type="number"
                                            placeholder={t("filters.minAgePlaceholder")}
                                            value={minAge ?? ""}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                onMinAgeChange(value ? Number.parseInt(value, 10) : null);
                                            }}
                                            className="bg-stone-700 border-stone-600 text-stone-100 placeholder-stone-400"
                                            min="18"
                                            max="100"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm block font-medium text-stone-300">
                                            {t("filters.maxAge")}
                                        </label>
                                        <Input
                                            type="number"
                                            placeholder={t("filters.maxAgePlaceholder")}
                                            value={maxAge ?? ""}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                onMaxAgeChange(value ? Number.parseInt(value, 10) : null);
                                            }}
                                            className="bg-stone-700 border-stone-600 text-stone-100 placeholder-stone-400"
                                            min="18"
                                            max="100"
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer with summary */}
                <div className="sticky bottom-0 bg-stone-800 pt-4 mt-6 border-t border-stone-700">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-stone-400">
                            {hasActiveFilters ? (
                                <>
                                    {activeFilterCount}{" "}
                                    {activeFilterCount === 1
                                        ? t("filters.activeFilter")
                                        : t("filters.activeFilters")}
                                </>
                            ) : (
                                t("filters.noActiveFilters")
                            )}
                        </p>
                        <Button
                            onClick={() => setOpen(false)}
                        >
                            {t("filters.apply")}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
