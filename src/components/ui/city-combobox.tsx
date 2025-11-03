"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useDebounce } from "use-debounce";
import { Combobox } from "@/components/ui/combobox";

interface CityComboboxProps {
    value: string;
    onChange: (value: string) => void;
    location: string;
    placeholder?: string;
}

export function CityCombobox({
    value,
    onChange,
    location,
    placeholder,
}: Readonly<CityComboboxProps>) {
    const [search, setSearch] = React.useState("");
    const [debouncedSearch] = useDebounce(search, 300);
    const [cities, setCities] = React.useState<{ value: string; label: string }[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const t = useTranslations("ui");

    // Cache for API responses to avoid unnecessary fetches
    const cacheRef = React.useRef<Map<string, { value: string; label: string }[]>>(new Map());

    const emptyMessage = React.useMemo(() => {
        if (isLoading) return t("loadingCities");
        if (search.length < 3) return t("enter3Characters");
        if (cities.length === 0) return t("noOptionsFound");
        return "";
    }, [isLoading, search, cities, t]);

    React.useEffect(() => {
        if (!location) {
            setCities([]);
            return;
        }

        // Only show remoteHome option when cities are found
        const remoteOption = { value: "remoteHome", label: t("remoteHome") };

        if (debouncedSearch.length < 3) {
            setCities([]);
            return;
        }

        const cacheKey = `${location}-${debouncedSearch}`;
        const cachedCities = cacheRef.current.get(cacheKey);

        if (cachedCities) {
            setCities(cachedCities);
            return;
        }

        const fetchCities = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(
                    `/api/cities?country=${encodeURIComponent(location)}&search=${encodeURIComponent(debouncedSearch)}`
                );
                if (response.ok) {
                    const data = await response.json();
                    const formattedCities = data.map((city: { name: string }) => ({
                        value: city.name,
                        label: city.name,
                    }));

                    // Only add remoteHome option if cities are found
                    const citiesWithRemote = formattedCities.length > 0
                        ? [remoteOption, ...formattedCities]
                        : formattedCities;

                    cacheRef.current.set(cacheKey, citiesWithRemote);
                    setCities(citiesWithRemote);
                } else {
                    // Don't show remoteHome if API fails
                    setCities([]);
                }
            } catch (error) {
                console.error("Error fetching cities:", error);
                // Don't show remoteHome if fetch fails
                setCities([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCities();
    }, [debouncedSearch, location, t]);

    const handleSearchChange = (newSearch: string) => {
        setSearch(newSearch);
        // Clear the selected value when user starts searching
        if (newSearch && value) {
            onChange("");
        }
    };

    const displayPlaceholder = placeholder || t("selectCity");

    return (
        <Combobox
            options={cities}
            value={value}
            onValueChange={onChange}
            placeholder={displayPlaceholder}
            allowCustom={false}
            onSearchChange={handleSearchChange}
            emptyMessage={emptyMessage}
            commandInputPlaceholder={t("searchCities")}
        />
    );
}
