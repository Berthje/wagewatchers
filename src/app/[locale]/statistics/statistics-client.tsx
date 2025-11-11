"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { SalaryEntry } from "@/lib/db/schema";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { FiltersModal } from "@/components/filters-modal";
import { useFilters } from "@/hooks/use-filters";
import { mean, median } from "d3-array";
import {
  useSalaryDisplay,
  convertCurrency,
  convertPeriod,
} from "@/contexts/salary-display-context";
import {
  TopSectorsChart,
  ExperienceGrowthChart,
  TopCountriesChart,
  SalaryDistributionChart,
  AgeDemographicsChart,
  ScatterPlotChart,
  YearOverYearChart,
  LocationHeatmapChart,
  InteractiveWorldMap,
} from "@/components/statistics";
import { exportToCSV, exportToPDF } from "@/lib/utils/export.utils";
import {
  AgeData,
  CountryData,
  ExperienceData,
  LocationHeatmapData,
  SalaryRangeData,
  ScatterData,
  SectorData,
  YearlyData,
} from "@/types";

export default function StatisticsClient() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const t = useTranslations("statistics");
  const tNav = useTranslations("nav");
  const { preferences } = useSalaryDisplay();
  const [allEntries, setAllEntries] = useState<SalaryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Use shared filters hook
  const { filters, actions, filteredEntries, activeFilterCount, options, maxValues } = useFilters(
    allEntries,
    undefined,
    preferences.currency,
    preferences.period
  );

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
  } = actions;
  const [sectorData, setSectorData] = useState<SectorData[]>([]);
  const [countryData, setCountryData] = useState<CountryData[]>([]);
  const [experienceData, setExperienceData] = useState<ExperienceData[]>([]);
  const [salaryRangeData, setSalaryRangeData] = useState<SalaryRangeData[]>([]);
  const [ageData, setAgeData] = useState<AgeData[]>([]);
  const [scatterData, setScatterData] = useState<ScatterData[]>([]);
  const [yearlyData, setYearlyData] = useState<YearlyData[]>([]);
  const [locationHeatmap, setLocationHeatmap] = useState<LocationHeatmapData[]>([]);

  // Handle scatter point click
  const handleScatterClick = (data: any) => {
    if (data?.id) {
      router.push(`/${locale}/dashboard/${data.id}`);
    }
  };

  // Fetch all entries on mount
  useEffect(() => {
    fetch("/api/entries")
      .then((res) => res.json())
      .then((entries: SalaryEntry[]) => {
        setAllEntries(entries);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Process data whenever filtered entries change
  useEffect(() => {
    if (filteredEntries.length === 0) return;

    const entries = filteredEntries;
    const sectorAgg: Record<string, SectorData> = entries.reduce(
      (acc: Record<string, SectorData>, entry: SalaryEntry) => {
        const sector = entry.sector || "Unknown";
        if (!acc[sector])
          acc[sector] = {
            sector,
            count: 0,
            avgGross: 0,
            totalGross: 0,
            salaries: [],
          };
        acc[sector].count++;
        // Convert salary to EUR and preferred period before aggregating
        let salaryInEur = convertCurrency(entry.grossSalary || 0, entry.currency, "EUR");
        // Convert from monthly (source) to user's preferred period
        salaryInEur = convertPeriod(salaryInEur, "monthly", preferences.period);
        acc[sector].salaries.push(salaryInEur);
        acc[sector].totalGross += salaryInEur;
        acc[sector].avgGross = mean(acc[sector].salaries) ?? 0;
        return acc;
      },
      {}
    );
    setSectorData(
      Object.values(sectorAgg)
        .sort((a, b) => b.avgGross - a.avgGross)
        .slice(0, 10)
    );

    const countryAgg: Record<string, CountryData> = entries.reduce(
      (acc: Record<string, CountryData>, entry: SalaryEntry) => {
        const country = entry.country || "Unknown";
        if (!acc[country])
          acc[country] = {
            country,
            avgSalary: 0,
            count: 0,
            salaries: [],
          };
        acc[country].count++;
        // Convert salary to EUR and preferred period before aggregating
        let salaryInEur = convertCurrency(entry.grossSalary || 0, entry.currency, "EUR");
        // Convert from monthly (source) to user's preferred period
        salaryInEur = convertPeriod(salaryInEur, "monthly", preferences.period);
        acc[country].salaries.push(salaryInEur);
        acc[country].avgSalary = mean(acc[country].salaries) ?? 0;
        return acc;
      },
      {}
    );
    setCountryData(
      Object.values(countryAgg)
        .sort((a, b) => b.avgSalary - a.avgSalary)
        .slice(0, 8)
    );

    const expAgg: Record<number, ExperienceData> = {};
    for (const entry of entries) {
      const exp = entry.workExperience || 0;
      if (!expAgg[exp]) {
        expAgg[exp] = {
          experience: exp,
          avgSalary: 0,
          count: 0,
          salaries: [],
        };
      }
      expAgg[exp].count++;
      // Convert salary to EUR and preferred period before aggregating
      let salaryInEur = convertCurrency(entry.grossSalary || 0, entry.currency, "EUR");
      // Convert from monthly (source) to user's preferred period
      salaryInEur = convertPeriod(salaryInEur, "monthly", preferences.period);
      expAgg[exp].salaries.push(salaryInEur);
      expAgg[exp].avgSalary = mean(expAgg[exp].salaries) ?? 0;
    }
    setExperienceData(Object.values(expAgg).sort((a, b) => a.experience - b.experience));

    const ranges = [
      { min: 0, max: 30000, label: "<30k" },
      { min: 30000, max: 50000, label: "30-50k" },
      { min: 50000, max: 70000, label: "50-70k" },
      { min: 70000, max: 90000, label: "70-90k" },
      { min: 90000, max: 120000, label: "90-120k" },
      { min: 120000, max: Infinity, label: "120k+" },
    ];
    const rangeCount = ranges.map((range) => ({
      range: range.label,
      count: entries.filter((e) => {
        let salaryInEur = convertCurrency(e.grossSalary || 0, e.currency, "EUR");
        // Convert to annual for range comparison (ranges are defined as annual amounts)
        salaryInEur = convertPeriod(salaryInEur, "monthly", "annual");
        return salaryInEur >= range.min && salaryInEur < range.max;
      }).length,
    }));
    setSalaryRangeData(rangeCount);

    const ageGroups = [
      { min: 0, max: 25, label: "<25" },
      { min: 25, max: 30, label: "25-30" },
      { min: 30, max: 35, label: "30-35" },
      { min: 35, max: 40, label: "35-40" },
      { min: 40, max: 50, label: "40-50" },
      { min: 50, max: Infinity, label: "50+" },
    ];
    const ageCount = ageGroups.map((group) => ({
      ageGroup: group.label,
      count: entries.filter((e) => (e.age || 0) >= group.min && (e.age || 0) < group.max).length,
    }));
    setAgeData(ageCount.filter((g) => g.count > 0));

    const scatterPoints = entries
      .filter(
        (entry) =>
          entry.grossSalary &&
          entry.workExperience !== null &&
          entry.workExperience !== undefined &&
          entry.age
      )
      .map((entry) => {
        let salaryInEur = convertCurrency(entry.grossSalary!, entry.currency, "EUR");
        // Convert from monthly (source) to user's preferred period
        salaryInEur = convertPeriod(salaryInEur, "monthly", preferences.period);
        return {
          id: entry.id,
          experience: entry.workExperience!,
          salary: salaryInEur,
          age: entry.age!,
          sector: entry.sector || "Unknown",
          country: entry.country || "Unknown",
        };
      });
    setScatterData(scatterPoints);

    const yearAgg: Record<number, { salaries: number[]; count: number }> = {};
    for (const entry of entries) {
      const year = new Date(entry.createdAt).getFullYear();
      if (!yearAgg[year]) {
        yearAgg[year] = { salaries: [], count: 0 };
      }
      if (entry.grossSalary) {
        // Convert salary to EUR and preferred period before aggregating
        let salaryInEur = convertCurrency(entry.grossSalary, entry.currency, "EUR");
        // Convert from monthly (source) to user's preferred period
        salaryInEur = convertPeriod(salaryInEur, "monthly", preferences.period);
        yearAgg[year].salaries.push(salaryInEur);
        yearAgg[year].count++;
      }
    }

    const yearlyStats = Object.entries(yearAgg)
      .map(([year, data]) => {
        const avgSalary = mean(data.salaries) ?? 0;
        const medianSalary = median(data.salaries) ?? 0;
        return {
          year: Number.parseInt(year),
          avgSalary,
          count: data.count,
          medianSalary,
        };
      })
      .sort((a, b) => a.year - b.year);
    setYearlyData(yearlyStats);

    const industryAgg: Record<string, { salaries: number[]; experiences: number[] }> = {};
    for (const entry of entries) {
      const sector = entry.sector || "Unknown";
      if (!industryAgg[sector]) {
        industryAgg[sector] = { salaries: [], experiences: [] };
      }
      if (entry.grossSalary) {
        // Convert salary to EUR and preferred period before aggregating
        let salaryInEur = convertCurrency(entry.grossSalary, entry.currency, "EUR");
        // Convert from monthly (source) to user's preferred period
        salaryInEur = convertPeriod(salaryInEur, "monthly", preferences.period);
        industryAgg[sector].salaries.push(salaryInEur);
      }
      if (entry.workExperience !== null && entry.workExperience !== undefined) {
        industryAgg[sector].experiences.push(entry.workExperience);
      }
    }

    const locationAgg: Record<string, { salaries: number[]; country: string }> = {};
    for (const entry of entries) {
      // Skip entries with missing city or country data
      if (!entry.workCity || !entry.country) return;

      const city = entry.workCity;
      const country = entry.country;
      const key = `${city}, ${country}`;
      if (!locationAgg[key]) {
        locationAgg[key] = { salaries: [], country };
      }
      if (entry.grossSalary) {
        // Convert salary to EUR and preferred period before aggregating
        let salaryInEur = convertCurrency(entry.grossSalary, entry.currency, "EUR");
        // Convert from monthly (source) to user's preferred period
        salaryInEur = convertPeriod(salaryInEur, "monthly", preferences.period);
        locationAgg[key].salaries.push(salaryInEur);
      }
    }

    const locationStats: LocationHeatmapData[] = Object.entries(locationAgg)
      .map(([location, data]) => {
        const [city] = location.split(", ");
        const count = data.salaries.length;
        const avgSalary = mean(data.salaries) ?? 0;
        return {
          city,
          country: data.country,
          avgSalary,
          count,
        };
      })
      .filter((item) => item.count >= 3) // Only show locations with 3+ entries
      .sort((a, b) => b.avgSalary - a.avgSalary)
      .slice(0, 20); // Top 20 locations
    setLocationHeatmap(locationStats);
  }, [filteredEntries, preferences.period]);

  // Export to CSV function
  const handleExportToCSV = () => {
    exportToCSV(filteredEntries);
  };

  // Export to PDF function
  const handleExportToPDF = () => {
    exportToPDF(filteredEntries, selectedCountries, selectedSectors, sectorData);
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
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-stone-100">{t("title")}</h1>
            {/* Filters and Export Buttons */}
            <div className="flex flex-wrap gap-3">
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
              <Button
                onClick={handleExportToCSV}
                variant="outline"
                className="flex items-center gap-2 bg-stone-800 border-stone-600 text-stone-100 hover:bg-stone-700"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {t("export.csv")}
              </Button>
              <Button
                onClick={handleExportToPDF}
                variant="outline"
                className="flex items-center gap-2 bg-stone-800 border-stone-600 text-stone-100 hover:bg-stone-700"
              >
                <FileDown className="w-4 h-4" />
                {t("export.pdf")}
              </Button>
            </div>
          </div>
          <p className="text-sm md:text-base text-stone-400">{t("subtitle")}</p>
        </div>

        {loading ? (
          <div className="grid gap-4 md:gap-8">
            <TopSectorsChart data={[]} loading={true} />

            {/* 2x2 Grid: Experience Growth, Top Countries, Salary Distribution, Age Demographics */}
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              {/* Experience Growth Skeleton */}
              <ExperienceGrowthChart data={[]} loading={true} />

              {/* Top Countries Skeleton */}
              <TopCountriesChart data={[]} loading={true} />

              {/* Salary Distribution Skeleton */}
              <SalaryDistributionChart data={[]} loading={true} />

              {/* Age Demographics Skeleton */}
              <AgeDemographicsChart data={[]} loading={true} />
            </div>

            {/* Scatter Plot Skeleton */}
            <ScatterPlotChart data={[]} loading={true} />
          </div>
        ) : (
          <div className="grid gap-4 md:gap-8">
            {filteredEntries.length === 0 ? (
              <Card className="bg-stone-800 border-stone-700">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-xl text-stone-300 mb-2">{t("noEntriesFound")}</p>
                  <p className="text-sm text-stone-400">{t("subtitle")}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Year-over-Year Comparison */}
                <YearOverYearChart data={yearlyData} loading={false} />

                {/* Location-Based Heatmap */}
                <LocationHeatmapChart data={locationHeatmap} loading={false} />

                {/* Top Paying Sectors */}
                <TopSectorsChart data={sectorData} loading={false} />

                {/* Salary by Experience & Country Comparison */}
                <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                  {/* Experience vs Salary */}
                  <ExperienceGrowthChart data={experienceData} loading={false} />

                  {/* Country Comparison */}
                  <TopCountriesChart data={countryData} loading={false} />
                </div>

                {/* Salary Distribution & Age Demographics */}
                <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                  {/* Salary Distribution */}
                  <SalaryDistributionChart data={salaryRangeData} loading={false} />

                  {/* Age Demographics */}
                  <AgeDemographicsChart data={ageData} loading={false} />
                </div>

                {/* Scatter Plot */}
                <ScatterPlotChart
                  data={scatterData}
                  loading={false}
                  onPointClick={handleScatterClick}
                />

                {/* Interactive World Map with Drill-Down */}
                <InteractiveWorldMap filters={filters} />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
