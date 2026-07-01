"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";
import am5geodata_belgiumHigh from "@amcharts/amcharts5-geodata/belgiumHigh";
import am5geodata_netherlandsHigh from "@amcharts/amcharts5-geodata/netherlandsHigh";
import am5geodata_germanyHigh from "@amcharts/amcharts5-geodata/germanyHigh";
import am5geodata_franceHigh from "@amcharts/amcharts5-geodata/franceHigh";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { SUPPORTED_COUNTRIES, COUNTRY_NAMES, COUNTRY_TRANSLATION_KEYS } from "@/lib/constants";
import type { MapDataResponse } from "@/types";
import { useSalaryDisplay, convertPeriod } from "@/contexts/salary-display-context";
import type { FilterState } from "@/hooks/use-filters";
import { logError } from "@/lib/logger";

const GEODATA_MAP = {
  Belgium: am5geodata_belgiumHigh,
  Netherlands: am5geodata_netherlandsHigh,
  Germany: am5geodata_germanyHigh,
  France: am5geodata_franceHigh,
} as const;

interface InteractiveWorldMapProps {
  filters?: Partial<FilterState>;
}

export function InteractiveWorldMap({ filters }: Readonly<InteractiveWorldMapProps>) {
  const chartRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<am5.Root | null>(null);
  const zoomTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mapData, setMapData] = useState<MapDataResponse>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const [currentView, setCurrentView] = useState<"world" | "country">("world");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const t = useTranslations("statistics");
  const { preferences } = useSalaryDisplay();

  // Helper function to get currency symbol - memoized with useCallback
  const getCurrencySymbol = useCallback(() => {
    switch (preferences.currency) {
      case "USD":
        return "$";
      case "GBP":
        return "£";
      case "EUR":
      default:
        return "€";
    }
  }, [preferences.currency]);

  const filterParams = useMemo(() => {
    const params = new URLSearchParams();

    // Map selectedSectors to sector (use first selected sector for map filtering)
    if (filters?.selectedSectors && filters.selectedSectors.length > 0) {
      params.append("sector", filters.selectedSectors[0]);
    }

    // Map countries
    if (filters?.selectedCountries && filters.selectedCountries.length > 0) {
      params.append("countries", filters.selectedCountries.join(","));
    }

    // Map cities
    if (filters?.selectedCities && filters.selectedCities.length > 0) {
      params.append("cities", filters.selectedCities.join(","));
    }

    // Work experience filters
    if (filters?.minWorkExperience !== null && filters?.minWorkExperience !== undefined) {
      params.append("minExperience", filters.minWorkExperience.toString());
    }
    if (filters?.maxWorkExperience !== null && filters?.maxWorkExperience !== undefined) {
      params.append("maxExperience", filters.maxWorkExperience.toString());
    }

    // Age filters
    if (filters?.minAge !== null && filters?.minAge !== undefined) {
      params.append("minAge", filters.minAge.toString());
    }
    if (filters?.maxAge !== null && filters?.maxAge !== undefined) {
      params.append("maxAge", filters.maxAge.toString());
    }

    // Salary filters - convert back to monthly for API comparison
    // Database stores all salaries as monthly values
    if (filters?.minGrossSalary !== null && filters?.minGrossSalary !== undefined) {
      const monthlyValue = Math.round(
        convertPeriod(filters.minGrossSalary, preferences.period, "monthly")
      );
      params.append("minGrossSalary", monthlyValue.toString());
    }
    if (filters?.maxGrossSalary !== null && filters?.maxGrossSalary !== undefined) {
      const monthlyValue = Math.round(
        convertPeriod(filters.maxGrossSalary, preferences.period, "monthly")
      );
      params.append("maxGrossSalary", monthlyValue.toString());
    }
    if (filters?.minNetSalary !== null && filters?.minNetSalary !== undefined) {
      const monthlyValue = Math.round(
        convertPeriod(filters.minNetSalary, preferences.period, "monthly")
      );
      params.append("minNetSalary", monthlyValue.toString());
    }
    if (filters?.maxNetSalary !== null && filters?.maxNetSalary !== undefined) {
      const monthlyValue = Math.round(
        convertPeriod(filters.maxNetSalary, preferences.period, "monthly")
      );
      params.append("maxNetSalary", monthlyValue.toString());
    }

    return params.toString();
  }, [
    filters?.selectedSectors,
    filters?.selectedCountries,
    filters?.selectedCities,
    filters?.minWorkExperience,
    filters?.maxWorkExperience,
    filters?.minAge,
    filters?.maxAge,
    filters?.minGrossSalary,
    filters?.maxGrossSalary,
    filters?.minNetSalary,
    filters?.maxNetSalary,
    preferences.period,
  ]);

  const dataToDisplay = useMemo(
    () => (currentView === "world" ? mapData.countries : mapData.provinces),
    [currentView, mapData.countries, mapData.provinces]
  );

  const countriesWithData = useMemo(
    () => new Set(dataToDisplay?.map((item) => item.id) || []),
    [dataToDisplay]
  );

  const translatedCountryName = useMemo(() => {
    if (!selectedCountry) return "";
    const countryCode = Object.keys(COUNTRY_NAMES).find(
      (key) => COUNTRY_NAMES[key] === selectedCountry
    );
    if (!countryCode) return selectedCountry;

    const translationKey = COUNTRY_TRANSLATION_KEYS[countryCode];
    if (!translationKey) return selectedCountry;

    try {
      return t(`countries.${translationKey}` as any);
    } catch {
      return COUNTRY_NAMES[countryCode] || selectedCountry;
    }
  }, [selectedCountry, t]);

  useEffect(() => {
    // Guard against stale / overlapping responses applying out of order.
    // React StrictMode (dev) double-invokes this effect, and filter/currency
    // changes can fire it again before a prior request resolves. Without this
    // flag, multiple responses each call setMapData, triggering multiple
    // dispose->recreate cycles of the amCharts Root on the same DOM node,
    // which intermittently leaves the map blank.
    let ignore = false;
    const controller = new AbortController();

    const fetchMapData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(filterParams);

        if (currentView === "country" && selectedCountry) {
          params.append("country", selectedCountry);
          params.append("drillDown", "true");
        }

        const url = `/api/statistics/map-data?${params.toString()}`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          // Capture the server's error body so the cause shows up in logs,
          // not just an opaque "Failed to fetch".
          const body = await response.text().catch(() => "");
          throw new Error(`HTTP ${response.status} on ${url}${body ? ` — ${body}` : ""}`);
        }

        const data = await response.json();
        if (!ignore) {
          setMapData(data);
          setError(null);
        }
      } catch (err) {
        if (ignore || (err instanceof DOMException && err.name === "AbortError")) return;
        logError("[InteractiveWorldMap] Failed to load map data", err, {
          view: currentView,
          country: selectedCountry,
          filterParams,
        });
        setMapData({});
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchMapData();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [filterParams, currentView, selectedCountry, retryNonce]);

  useEffect(() => {
    if (!chartRef.current || loading || !dataToDisplay) return;

    if (rootRef.current) {
      rootRef.current.dispose();
      rootRef.current = null;
    }

    let root: am5.Root | null = null;
    try {
      root = am5.Root.new(chartRef.current);
      rootRef.current = root;

      root._logo?.dispose();
      root.setThemes([am5themes_Animated.new(root)]);

      // Detect the active theme at chart-build time so the map polygon
      // colors follow light/dark. The orange heat scale is theme-agnostic
      // and intentionally left unchanged below.
      const isDark = document.documentElement.classList.contains("dark");
      const polygonFill = isDark ? 0x292524 : 0xe7e5e4; // stone-800 / stone-200
      const polygonStroke = isDark ? 0x57534e : 0xa8a29e; // stone-600 / stone-400
      const polygonHoverFill = isDark ? 0x57534e : 0xa8a29e; // stone-600 / stone-400
      const accentColor = isDark ? 0x000000 : 0x57534e; // black / stone-600
      // Themed HTML tooltip palette (matches semantic card/border tokens).
      const tooltipBg = isDark ? "rgb(87, 83, 79)" : "rgb(255, 255, 255)";
      const tooltipText = isDark ? "rgb(231, 229, 228)" : "rgb(28, 25, 23)";
      const tooltipBorder = isDark ? "rgb(68, 64, 60)" : "rgb(214, 211, 209)";

      const chart = root.container.children.push(
        am5map.MapChart.new(root, {
          panX: "rotateX",
          panY: "translateY",
          projection: am5map.geoMercator(),
          homeGeoPoint: currentView === "world" ? { longitude: 10, latitude: 52 } : undefined,
        })
      );

      const geodata =
        currentView === "world"
          ? am5geodata_worldLow
          : (selectedCountry && GEODATA_MAP[selectedCountry as keyof typeof GEODATA_MAP]) ||
            am5geodata_worldLow;

      const polygonSeries = chart.series.push(
        am5map.MapPolygonSeries.new(root, {
          geoJSON: geodata,
          valueField: "value",
          calculateAggregates: true,
          exclude: ["AQ"],
        })
      );

      polygonSeries.mapPolygons.template.setAll({
        tooltipText: "{name}\n{tooltipText}",
        interactive: true,
        fill: am5.color(polygonFill),
        stroke: am5.color(polygonStroke),
        strokeWidth: 1,
      });

      const tooltip = am5.Tooltip.new(root, {
        getFillFromSprite: false,
        autoTextColor: false,
        pointerOrientation: "vertical",
      });
      tooltip.get("background")?.setAll({
        fill: am5.color(accentColor),
        fillOpacity: 0,
        stroke: am5.color(accentColor),
        strokeOpacity: 0,
      });
      polygonSeries.set("tooltip", tooltip);

      polygonSeries.mapPolygons.template.set(
        "tooltipHTML",
        `
      <div style="
        background: ${tooltipBg};
        color: ${tooltipText};
        padding: 0.75rem;
        border-radius: 0.5rem;
        border: 1px solid ${tooltipBorder};
        font-family: ui-sans-serif, system-ui, sans-serif;
        font-size: 0.875rem;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
      ">
        {tooltipText}
      </div>
    `
      );

      polygonSeries.mapPolygons.template.adapters.add("tooltipHTML", (html, target) => {
        const dataContext = target.dataItem?.dataContext as any;
        const hasData = dataContext?.value > 0;

        if (hasData) {
          return html;
        }

        // For countries with no data, show a simple tooltip with just the name.
        return `
        <div style="
          background: ${tooltipBg};
          color: ${tooltipText};
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid ${tooltipBorder};
          font-family: ui-sans-serif, system-ui, sans-serif;
          font-size: 0.875rem;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        ">
          {name}
        </div>
      `;
      });

      polygonSeries.mapPolygons.template.states.create("hover", {
        fill: am5.color(polygonHoverFill),
      });

      if (currentView === "world") {
        polygonSeries.mapPolygons.template.events.on("click", (ev) => {
          const polygon = ev.target;
          const customData = polygon.dataItem?.dataContext as any;

          const hasData = !!(customData?.value || customData?.avgSalary);
          if (!hasData) return;

          const countryId = customData.id;

          if (countryId && (SUPPORTED_COUNTRIES as readonly string[]).includes(countryId)) {
            setSelectedCountry(COUNTRY_NAMES[countryId]);
            setCurrentView("country");
          }
        });
      }

      if (dataToDisplay.length > 0) {
        const currencySymbol = getCurrencySymbol();
        polygonSeries.data.setAll(
          dataToDisplay.map((item) => ({
            id: item.id,
            name: item.name,
            value: currentView === "country" ? item.count : item.avgSalary,
            tooltipText: `<span style="color: rgb(251, 146, 60); font-weight: 600;">${item.name}</span><br/>${t("avgSalary")}: ${currencySymbol}${item.avgSalary.toLocaleString()}<br/>${t("medianSalary")}: ${currencySymbol}${item.medianSalary.toLocaleString()}<br/>${t("entries")}: ${item.count}`,
          }))
        );

        polygonSeries.set("heatRules", [
          {
            target: polygonSeries.mapPolygons.template,
            dataField: "value",
            min: am5.color(0xfed7aa),
            max: am5.color(0xea580c),
            key: "fill",
          },
        ]);
      }

      if (currentView === "world") {
        polygonSeries.mapPolygons.each((polygon) => {
          const dataContext = polygon.dataItem?.dataContext as any;
          const polygonId = dataContext?.id;

          if (!polygonId || !countriesWithData.has(polygonId)) {
            polygon.set("tooltipText", undefined);
            polygon.set("tooltipHTML", undefined);
          }
        });
      }

      chart.appear(1000, 100);

      if (currentView === "world") {
        zoomTimeoutRef.current = setTimeout(() => {
          // The Root can be disposed (re-render / unmount) before this fires.
          if (!root || root.isDisposed()) return;
          chart.zoomToGeoPoint({ longitude: 10, latitude: 50 }, 5, true);
        }, 100);
      }

      setError(null);
    } catch (err) {
      // amCharts can throw during init (e.g. a Root already attached to this
      // DOM node after a fast re-render). Log it and surface a retry instead of
      // letting it bubble up and blank the whole statistics page.
      logError("[InteractiveWorldMap] Failed to render map", err, {
        view: currentView,
        country: selectedCountry,
      });
      setError(err instanceof Error ? err.message : "Map failed to render");
      root?.dispose();
      rootRef.current = null;
      return;
    }

    return () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
        zoomTimeoutRef.current = null;
      }
      root?.dispose();
      rootRef.current = null;
    };
  }, [
    mapData,
    loading,
    currentView,
    selectedCountry,
    t,
    dataToDisplay,
    countriesWithData,
    getCurrencySymbol,
  ]);

  const handleBackToWorld = useCallback(() => {
    setCurrentView("world");
    setSelectedCountry(null);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setRetryNonce((n) => n + 1);
  }, []);

  return (
    <Card className="border-border bg-card space-y-3">
      <CardHeader className="flex flex-col justify-between md:flex-row">
        <div className="flex flex-col space-y-2">
          <CardTitle className="text-foreground md:pr-40">
            {currentView === "world"
              ? t("worldSalaryMap")
              : `${translatedCountryName} ${t("provinceMap")}`}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {currentView === "world" ? t("worldMapDescription") : t("provinceMapDescription")}
          </CardDescription>
        </div>
        {currentView === "country" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToWorld}
            className="mt-2 w-full md:w-auto md:mt-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToWorld")}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="relative h-[400px] md:h-[500px] lg:h-[600px]">
          <div ref={chartRef} className="rounded-lg border border-border bg-card h-full w-full" />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">{t("loading")}...</p>
            </div>
          )}
          {!loading && error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-card/80 px-4 text-center">
              <p className="text-muted-foreground">{t("mapError")}</p>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                {t("retry")}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
