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

        // Always show remoteHome option, even without search
        const remoteOption = { value: "remoteHome", label: t("remoteHome") };

        if (debouncedSearch.length < 3) {
            setCities([remoteOption]);
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

                    // Always add remoteHome option at the top
                    const citiesWithRemote = [remoteOption, ...formattedCities];

                    cacheRef.current.set(cacheKey, citiesWithRemote);
                    setCities(citiesWithRemote);
                } else {
                    // Even if API fails, show remoteHome option
                    setCities([remoteOption]);
                }
            } catch (error) {
                console.error("Error fetching cities:", error);
                // Even if fetch fails, show remoteHome option
                setCities([remoteOption]);
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
