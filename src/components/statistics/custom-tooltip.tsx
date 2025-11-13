"use client";

import { useTranslations } from "next-intl";
import { useSalaryDisplay, formatSalaryWithPreferences } from "@/contexts/salary-display-context";

interface CustomTooltipProps {
  readonly active?: boolean;
  readonly payload?: any[];
  readonly label?: any;
  readonly chartType?:
    | "experience"
    | "year"
    | "sector"
    | "country"
    | "location"
    | "age-demographics"
    | "scatter"
    | "default";
  readonly total?: number; // For pie charts to calculate percentages
  readonly colors?: string[]; // Optional colors array for charts with multiple colors
  readonly data?: any[]; // Optional data array to match colors with data points
}

export function CustomTooltip({
  active,
  payload,
  label,
  chartType = "default",
  total,
  colors,
  data,
}: CustomTooltipProps) {
  const t = useTranslations("statistics");
  const { preferences } = useSalaryDisplay();

  // Filter payload for box plot charts to avoid duplicate median entries
  const filteredPayload = chartType === "experience" && payload
    ? payload.filter(entry => entry.dataKey !== "median" || entry.type !== "line")
    : payload;

  const formatLabel = (label: any) => {
    if (chartType === "experience") {
      return `${label} ${t("charts.experienceGrowth.yearsLabel")}`;
    }
    if (chartType === "age-demographics") {
      // For pie chart, get the age group from payload if label is not available
      if (!label && payload?.[0]?.payload?.ageGroup) {
        return payload[0].payload.ageGroup;
      }
      return label; // Age group label for pie chart header
    }
    if (label && typeof label === "string" && label.includes(",")) {
      // This is likely a scatter plot coordinate label like "(5, 45000)"
      return t("charts.scatterPlot.dataPointLabel");
    }
    return label || t("charts.scatterPlot.dataPointLabel");
  };

  const formatValue = (value: any, dataKey: string) => {
    if (dataKey === "avgSalary" || dataKey === "avgGross" || dataKey === "medianSalary" || dataKey === "medianGross" || dataKey === "grossSalary" || dataKey === "min" || dataKey === "q1" || dataKey === "median" || dataKey === "q3" || dataKey === "max") {
      return formatSalaryWithPreferences(
        value,
        "EUR",
        false,
        preferences.currency,
        preferences.period
      );
    }
    if (dataKey === "taxPercentage") {
      return `${value}%`;
    }
    if (chartType === "age-demographics" && dataKey === "count" && total) {
      const percentage = ((value / total) * 100).toFixed(1);
      return `${value} (${percentage}%)`;
    }
    return value;
  };

  const getCorrectColor = (entry: any, index: number) => {
    // First try to get color from the entry (should work with Cell components)
    if (entry.color) {
      return entry.color;
    }

    // If colors array is provided and data array is available, find the matching data point
    if (colors && data && label !== undefined) {
      const dataIndex = data.findIndex((item) => {
        // For different chart types, match by different keys
        if (chartType === "age-demographics") {
          return item.ageGroup === label;
        }
        if (chartType === "location") {
          return item.city === label;
        }
        // For salary distribution, match by range
        return item.range === label;
      });

      if (dataIndex !== -1) {
        return colors[dataIndex % colors.length];
      }
    }

    // Fallback to colors array by index
    if (colors) {
      return colors[index % colors.length];
    }

    // Final fallback
    return "#ea580c";
  };

  const getLabelText = (dataKey: string) => {
    switch (dataKey) {
      case "avgSalary":
      case "avgGross":
        return t("charts.tooltips.avgSalary");
      case "medianSalary":
      case "medianGross":
        return t("charts.tooltips.medianSalary");
      case "grossSalary":
        return t("charts.tooltips.grossSalary");
      case "taxPercentage":
        return t("charts.tooltips.taxPercentage");
      case "min":
        return t("charts.tooltips.min");
      case "q1":
        return t("charts.tooltips.q1");
      case "median":
        return t("charts.tooltips.median");
      case "q3":
        return t("charts.tooltips.q3");
      case "max":
        return t("charts.tooltips.max");
      case "count":
        if (chartType === "age-demographics") {
          // For pie chart, show "Entries" as the label
          return t("charts.tooltips.entries");
        }
        return t("charts.tooltips.entries"); // Use "entries" instead of "count" for consistency
      default:
        return dataKey;
    }
  };

  // Special handling for scatter plots - show values without labels
  if (chartType === "scatter") {
    const dataPoint = payload?.[0]?.payload;
    if (!dataPoint) return null;

    return (
      <div className="bg-stone-800 border border-stone-600 rounded-lg shadow-lg p-4 min-w-[220px]">
        <div className="text-stone-200 font-semibold text-sm mb-3 text-center border-b border-stone-600 pb-2">
          {t("charts.scatterPlot.dataPointLabel")}
        </div>
        <div className="flex items-center justify-between px-4">
          {/* Experience */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-center">
              <div className="text-stone-300 text-xs font-medium">
                {t("charts.tooltips.experience")}
              </div>
              <div className="text-stone-100 fontx²²-bold text-sm">
                {dataPoint.experience} {t("charts.experienceGrowth.xAxisLabel")}
              </div>
            </div>
          </div>

          {/* Salary */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-center">
              <div className="text-stone-300 text-xs font-medium">
                {t("charts.tooltips.salary")}
              </div>
              <div className="text-stone-100 font-bold text-sm">
                {formatSalaryWithPreferences(
                  dataPoint.salary,
                  "EUR",
                  false,
                  preferences.currency,
                  preferences.period
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-800 border border-stone-600 rounded-lg shadow-lg p-3 min-w-[200px]">
      <div className="text-stone-200 font-medium text-sm mb-2 border-b border-stone-600 pb-1">
        {formatLabel(label)}
      </div>
      <div className="space-y-1">
        {filteredPayload!.map((entry, index) => (
          <div
            key={`${entry.dataKey}-${index}`}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getCorrectColor(entry, index) }}
              />
              <span className="text-stone-300 text-sm">{getLabelText(entry.dataKey)}</span>
            </div>
            <span className="text-stone-100 font-medium text-sm">
              {formatValue(entry.value, entry.dataKey)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
